import { Router, type IRouter } from "express";
import {
  deleteUserCardController,
  getUserCardsController,
} from "../controllers/cards-controller.js";
import { verifiedUserMiddleware } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/cards", verifiedUserMiddleware, getUserCardsController);
router.delete("/cards/:id", verifiedUserMiddleware, deleteUserCardController);

export default router;

