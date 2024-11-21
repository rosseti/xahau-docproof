import { Request, Response } from "express";
import DIDResolver from "../resolvers/DIDResolver";

export class DIDController {
  static async getDID(req: Request, res: Response): Promise<any> {
    const resolver = new DIDResolver();
    try {
      const resolution = await resolver.resolveDID(req.params.did);

      let didDocument = null;

      if (resolution.metadata.success) {
        didDocument = await resolver.createDIDDocument(resolution);
      }

      res.json({
        ...resolution,
        didDocument,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
