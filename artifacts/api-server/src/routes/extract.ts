import { Router, type IRouter } from "express";
import { extractCardController } from "../controllers/extract-controller.js";
import { verifiedUserMiddleware } from "../middleware/auth.js";

const router: IRouter = Router();

router.post("/extract", verifiedUserMiddleware, extractCardController);

export default router;

