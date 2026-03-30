import { Router, type IRouter } from "express";
import {
  authMeController,
  signupController,
  userLoginController,
} from "../controllers/auth-controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router: IRouter = Router();

router.post("/auth/signup", signupController);
router.post("/auth/login", userLoginController);
router.get("/auth/me", authMiddleware, authMeController);

export default router;
