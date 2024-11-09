import { HttpException } from "@/exceptions";
import { AuthRequest } from "@/shared/types/AuthRequest";
import { Request, Response } from "express";
import { DocumentService } from "../services/DocumentService";

export class DocumentController {
  static async getDocuments(req: AuthRequest, res: Response): Promise<any> {
    const wallet = req.user!.sub;

    try {
      const documents = await DocumentService.getDocuments(wallet);

      return res.status(200).json({ documents });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Internal server error. ", error });
    }
  }

  static async updateDocumentStatus(
    req: AuthRequest,
    res: Response
  ): Promise<any> {
    const { documentId } = req.params;
    const { newStatus, transactionHash, contractStorageKey } = req.body;

    try {
      const document = await DocumentService.updateDocumentStatus(
        documentId,
        newStatus,
        {
          transactionHash,
          contractStorageKey,
        }
      );

      return res.status(200).json({
        document,
      });
    } catch (error: any) {
      const statusCode =
        error instanceof HttpException ? error.statusCode : 500;
      return res.status(statusCode).json({
        message: `Error: ${error.message}`,
      });
    }
  }

  static async getDocumentById(req: AuthRequest, res: Response): Promise<any> {
    const { documentId } = req.params;
    try {
      const document = await DocumentService.getDocumentById(documentId);

      return res.status(200).json({
        document,
      });
    } catch (error: any) {
      const statusCode =
        error instanceof HttpException ? error.statusCode : 500;
      return res.status(statusCode).json({
        message: `Error: ${error.message}`,
      });
    }
  }

  static async updateAuthorizedSigners(
    req: AuthRequest,
    res: Response
  ): Promise<any> {
    const { documentId } = req.params;
    const { authorizedSigners } = req.body;

    try {
      const authorizedSignersHash =
        await DocumentService.updateAuthorizedSigners(
          documentId,
          authorizedSigners
        );

      return res.status(200).json({
        authorizedSigners,
        authorizedSignersHash,
      });
    } catch (error: any) {
      const statusCode =
        error instanceof HttpException ? error.statusCode : 500;
      return res.status(statusCode).json({
        message: `Error: ${error.message}`,
      });
    }
  }

  static async createDocument(req: any, res: any): Promise<any> {
    console.log(req.user);
    try {
      const newDocument = await DocumentService.createDocument(req);
      
      console.log(newDocument);

      return res.status(200).json({
        status: "ok",
        message: "File created successfully",
        data: {
          id: newDocument._id,
          hash: newDocument.hash,
          expirationTime: newDocument.expirationTime,
        },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Internal server error. ", error });
    }
  }
}
