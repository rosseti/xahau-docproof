import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController";
import { authenticateJWT } from "@/modules/auth/middleware/authenticateJWT";
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 33554432 }, // 32MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/x-pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
  },
});

export const docRoutes = Router();

docRoutes.get("/reviewAndSign", DocumentController.reviewAndSign);
docRoutes.get("/generatePDFProof", DocumentController.generatePDFProof);


docRoutes.get("/list", authenticateJWT, DocumentController.getDocuments);

docRoutes.put("/:documentId/save-notify-signers", authenticateJWT, DocumentController.saveAndNotifySigners);
docRoutes.post("/create", [authenticateJWT, upload.single("file")], DocumentController.createDocument);

docRoutes.get("/:documentId/:signerId", DocumentController.getDocumentByIdAndSignerId);
docRoutes.get("/:documentId", authenticateJWT, DocumentController.getDocumentById);
