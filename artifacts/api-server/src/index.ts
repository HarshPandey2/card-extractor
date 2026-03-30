import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { verifyDatabaseConnection } from "@workspace/db";
import { ensureSeededAccounts, validateSeededAccountEnv } from "./services/auth-service.js";

const parsed = Number(process.env.PORT);
const port = Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;

async function start() {
  try {
    validateSeededAccountEnv();
    await verifyDatabaseConnection();
    logger.info("Database connection verified");
    const seededAccounts = await ensureSeededAccounts();
    if (seededAccounts) {
      logger.info("Seeded admin/client accounts ensured");
    }
  } catch (err) {
    logger.error({ err }, "Database connection failed");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

void start();
