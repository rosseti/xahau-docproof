import { AuthRequest } from "@/shared/types/AuthRequest";
import { Response } from "express";
import signatureService, { VerifyPayload } from "../services/SignatureService";
const signer = require("node-signpdf").default;

export class OrigoController {
  static async verifySignature(req: AuthRequest, res: Response) {
    try {
      const { sha256, signature, rAddress, id } = req.body || {};

      const result = await signatureService.verifyPayload({
        sha256,
        signature,
        rAddress,
        id,
        useXamanWallet: true
      } as VerifyPayload);

      return res.status(result.status).json(result.body);
    } catch (err: any) {
      console.error("verify-signature route error:", err);
      return res.status(500).json({ message: `Internal server error: ${err.message}` });
    }
  }
}
