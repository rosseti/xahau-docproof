const fetch = require("node-fetch");
import crypto from "crypto";

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

    // Separar o DID da query
    const [didPart, queryPart] = did.split("?");
    const [prefix, method, txHash] = didPart.split(":");

    if (prefix !== "did") {
      throw new Error(`Invalid DID format: ${did}`);
    }

    // Processar parâmetros da query
    const params = new URLSearchParams(queryPart);
    const networkName = params.get("network") || "xahau";
    const networkType = params.get("network_type") || "testnet";

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
      const response = await fetch(
        networkType == "mainnet" ? XAHAU_MAINNET_RPC : XAHAU_TESTNET_RPC,
        {
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
        }
      );

      const result: any = await response.json();

      if ("error" in result.result) {
        throw new Error(result.result.error_message);
      }
      console.log(result);

      if (!result.result.HookParameters) {
        throw new Error("Invalid hook parameters");
      }

      if (
        "HookParameters" in result.result &&
        result.result.HookParameters.length < 2
      ) {
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

  async createDIDDocument(resolution: any) {
    const { did, metadata, network, networkType } = resolution;

    const publicKey = metadata.data.SigningPubKey;

    return {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2020/v1",
      ],
      id: did.split("?")[0], // Remove query params
      verificationMethod: [
        {
          id: `${did.split("?")[0]}#key-1`,
          type: "Ed25519VerificationKey2020",
          controller: did.split("?")[0],
          publicKeyMultibase: `f${publicKey}`,
        },
      ],
      authentication: [`${did.split("?")[0]}#key-1`],
      assertionMethod: [`${did.split("?")[0]}#key-1`],
      service: [
        {
          id: `${did.split("?")[0]}#xahau-service`,
          type: "BlockchainTransactionService",
          serviceEndpoint: {
            network,
            networkType,
            txHash: metadata.metadata.txHash,
            account: metadata.data.Account,
          },
        },
      ],
    };
  }

  async getDIDDocument(did: string) {
    const resolution = await this.resolveDID(did);
    return this.createDIDDocument(resolution);
  }
}
