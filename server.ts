import express, { Request, Response } from "express";
import next from "next";
import cron from "node-cron";
import pool from "./lib/mysql"; // Make sure lib/mysql.ts has a default export
import { checkAndCloseExpiredWagers } from "./services/wagerService";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Run cron every minute
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Running wager expiry job...");
    try {
      await checkAndCloseExpiredWagers();
    } catch (error) {
      console.error("Error running cron job:", error);
    }
  });

  // Pass types for req/res explicitly
  server.all("*", (req: Request, res: Response) => handle(req, res));

  server.listen(3000, (err?: Error) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});

