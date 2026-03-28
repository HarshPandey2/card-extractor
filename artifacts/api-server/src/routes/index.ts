import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import extractRouter from "./extract.js";
import adminLoginRouter from "./admin/login.js";
import adminCardsRouter from "./admin/cards.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(extractRouter);
router.use(adminLoginRouter);
router.use(adminCardsRouter);

export default router;
