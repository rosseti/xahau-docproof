import Web3 from "web3";

const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET_KEY || "secret";

export class AuthValidator {
  static validateAndSignJWT = (signature: string, message: string, wallet: string) => {
    // const { signature, message, wallet } = req.body;

    if (!signature || !message || !wallet) {
      throw new Error("Signature, Message and Wallet are required.");
    }

    const web3 = new Web3();
    const recoveredAccount = web3.eth.accounts.recover(message, signature);
    if (recoveredAccount.toLowerCase() !== wallet.toLowerCase()) {
      throw new Error("Invalid signature");
    }

    const token = jwt.sign({ wallet }, SECRET_KEY, { expiresIn: "1h" });

    return token;
  };
}
