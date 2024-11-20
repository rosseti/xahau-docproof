const fetch = require('node-fetch');
import crypto from 'crypto';

export default class DIDResolver {
  method: string = "docproof";
  cache: any;
  cacheTimeout: number;

  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  async resolveDID(did: string) {
    if (this.cache.has(did)) {
      const cached = this.cache.get(did);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(did);
    }

    const [prefix, method, network, txHash] = did.split(":");
    const [networkName, networkType] = network.split("-");

    if (method !== this.method) {
      throw new Error(`Unknown DID method: ${method}`);
    }

    try {
      const txData = await this.fetchTransactionData(networkType, txHash);

      const resolution = {
        did,
        network: networkName,
        networkType,
        txHash,
        metadata: txData,
        timestamp: Date.now(),
      };

      this.cache.set(did, {
        data: resolution,
        timestamp: Date.now(),
      });

      return resolution;
    } catch (error: any) {
      throw new Error(`Failed to resolve DID: ${error.message}`);
    }
  }

  async validateFileHash(fileBuffer: string, expectedHash: string) {
    const calculatedHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    return {
      matches: calculatedHash === expectedHash,
      calculatedHash,
      expectedHash,
    };
  }

  validateHookParameters(hookParams: any) {
    const DOC_HASH = "446F6348617368";
    const DOC_ID = "446F634964";

    let docHash = null;
    let docId = null;

    for (const param of hookParams) {
      const { HookParameterName, HookParameterValue } = param.HookParameter;

      switch (HookParameterName) {
        case DOC_HASH:
          docHash = HookParameterValue;
          break;
        case DOC_ID:
          docId = HookParameterValue;
          break;
      }
    }

    return {
      isValid: Boolean(docHash && docId),
      docHash,
      docId,
    };
  }

  async fetchTransactionData(networkType: string, txHash: string) {
    const XAHAU_TESTNET_RPC = "https://xahau-test.net";
    const XAHAU_MAINNET_RPC = "https://xahau.network";

    try {
      const response = await fetch(networkType == "mainnet" ? XAHAU_MAINNET_RPC : XAHAU_TESTNET_RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "tx",
          params: [
            {
              transaction: txHash,
              binary: false,
            },
          ],
          id: 1,
        }),
      });

      const result: any = await response.json();

      if ('error' in result.result) {
        throw new Error(result.result.error_message);
      }
      console.log(result);

      if (!result.result.HookParameters) {
        throw new Error("Invalid hook parameters");
      }

      if ('HookParameters' in result.result && result.result.HookParameters.length < 2) {
        throw new Error("Invalid hook parameters");
      }

      const hookParamsValidation = this.validateHookParameters(
        result.result.HookParameters
      );
      if (!hookParamsValidation.isValid) {
        throw new Error("Invalid hook parameters");
      }

      return {
        success: true,
        data: result.result,
        metadata: {
          network: networkType,
          timestamp: new Date().toISOString(),
          txHash,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          network: networkType,
          timestamp: new Date().toISOString(),
          txHash,
        },
      };
    }
  }
}

