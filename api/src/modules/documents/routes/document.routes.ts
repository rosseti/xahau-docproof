import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController";
import { authenticateJWT } from "@/modules/auth/middleware/authenticateJWT";
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 100 }, // Limite de 5MB
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

docRoutes.get("/list", authenticateJWT, DocumentController.getDocuments);
// docRoutes.put("/:documentId/status", authenticateJWT, DocumentController.updateDocumentStatus);
docRoutes.get("/:documentId", authenticateJWT, DocumentController.getDocumentById);
docRoutes.put("/:documentId/save-notify-signers", authenticateJWT, DocumentController.saveAndNotifySigners);
docRoutes.post("/create", [authenticateJWT, upload.single("file")], DocumentController.createDocument);

// authRoutes.get("/me", authenticateJWT, AuthController.me);
