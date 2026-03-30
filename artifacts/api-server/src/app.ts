import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const configuredCorsOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsAllowedOrigins =
  configuredCorsOrigins?.length
    ? configuredCorsOrigins
    : process.env.NODE_ENV !== "production"
      ? ["http://localhost:5173", "http://127.0.0.1:5173"]
      : undefined;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors(
    corsAllowedOrigins?.length
      ? {
          origin: corsAllowedOrigins,
        }
      : undefined,
  ),
);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/api", router);
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  req.log?.error({ err }, "Unhandled request error");
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong.",
  });
});

export default app;
