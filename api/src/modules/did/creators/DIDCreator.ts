export default class DIDCreator {
  private method: string = "docproof";
  private network: string = "xahau";
  private networkType: string = "mainnet"; // or 'testnet'

  createDID(txHash: string): string 
  {
    let didString = `did:${this.method}:${txHash}`;

    if (process.env.NEXT_PUBLIC_NETWORK_ID == "21338") {
      this.networkType = "testnet";
      
      didString += `?network=${this.network}&network_type=${this.networkType}`;
    }

    return didString;
  }

  setEnvironment(networkType: "mainnet" | "testnet") {
    this.networkType = networkType;
  }

  validateHash(txHash: string): boolean {
    return /^[A-Fa-f0-9]+$/.test(txHash);
  }
}
