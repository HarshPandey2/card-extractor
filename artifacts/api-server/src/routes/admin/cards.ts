import { Router, type IRouter } from "express";
import {
  deleteAdminCardController,
  getAdminCardsController,
} from "../../controllers/admin-cards-controller.js";
import { adminMiddleware } from "../../middleware/auth.js";

const router: IRouter = Router();

router.get("/admin/cards", adminMiddleware, getAdminCardsController);
router.delete("/admin/card/:id", adminMiddleware, deleteAdminCardController);

export default router;

