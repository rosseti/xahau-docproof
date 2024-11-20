export default class DIDCreator {
  private method: string = "docproof";
  private network: string = "xahau";
  private networkType: string = "mainnet"; // or 'testnet'

  createDID(txHash: string): string {
    return `did:${this.method}:${this.network}-${this.networkType}:${txHash}`;
  }

  setEnvironment(networkType: "mainnet" | "testnet") {
    this.networkType = networkType;
  }

  validateHash(txHash: string): boolean {
    return /^[A-Fa-f0-9]+$/.test(txHash);
  }
}
