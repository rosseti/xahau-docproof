import { Request, Response } from "express";
import DIDResolver from "../resolvers/DIDResolver";

export class DIDController {
    static async getDID(req: Request, res: Response): Promise<any> {    
  
        const resolver = new DIDResolver();
        try {
            const resolution = await resolver.resolveDID(req.params.did);
            res.json(resolution);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}