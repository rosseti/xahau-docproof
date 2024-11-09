import { Router } from "express";

import { authRoutes } from "@/modules/auth/routes/auth.routes";
import { docRoutes } from "@/modules/documents/routes/document.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/doc", docRoutes);

export { router };
