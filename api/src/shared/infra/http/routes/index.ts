import { Router } from "express";

import { authRoutes } from "@/modules/auth/routes/auth.routes";
import { docRoutes } from "@/modules/documents/routes/document.routes";
import { didRoutes } from "@/modules/did/routes/did.routes";
import { origoRoutes } from "@/modules/origo/routes/origo.routes";
const router = Router();

router.use("/auth", authRoutes);
router.use("/doc", docRoutes);
router.use("/did", didRoutes);
router.use("/origo", origoRoutes);

export { router };
