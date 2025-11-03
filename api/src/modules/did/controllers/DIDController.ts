import { Request, Response } from "express";
import DIDResolver from "../resolvers/DIDResolver";
import UserDocument from "@/modules/documents/models/UserDocument";
import { HttpException } from "@/exceptions";
import { SignatureService } from "@/modules/documents/services/SignatureService";

export class DIDController {
  static async getDID(req: Request, res: Response): Promise<any> {
    const resolver = new DIDResolver();
    try {

      const resolution: any = await resolver.resolveDID(req.params.did);

      const document = await UserDocument.findOne({
        signers: { $elemMatch: { txHash: resolution.txHash } },
      }).exec();

      if (!document) {
        throw new HttpException(404, "Document not found");
      }

      const signer = document.signers.find(
        s => s.txHash === resolution.txHash
      );

      if (!signer?.signed) {
        throw new HttpException(400, "DID not yet signed");
      }

      if (signer.method == 'offchain') {
        const { txData } = await SignatureService.verifyOffchainSignature(signer.signature);

        resolution.metadata = {
          metadata: {
            txHash: txData.hash,
            account: txData.Account,
          },
          data: txData
        }
      }

      let didDocument = null;

      if (resolution) {
        didDocument = await resolver.createDIDDocument(resolution);
      }

      res.json({
        ...resolution,
        didDocument,
        method: signer.method,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
