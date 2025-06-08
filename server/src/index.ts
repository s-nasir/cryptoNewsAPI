import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import winston from "winston";
import { scrapeOne, SOURCES, CRYPTOS, BUZZWORDS, Article } from "./scrape";

dotenv.config();

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

const app = express();
const PORT = process.env.PORT || 9000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// meta endpoint – lets the UI build filter lists dynamically
app.get("/meta", (_, res) => {
  try {
    res.json({
      sources: SOURCES.map(s => s.name),
      cryptos: CRYPTOS,
      buzzwords: BUZZWORDS
    });
  } catch (e) {
    logger.error("Meta endpoint error:", e);
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
});


app.get("/articles", async (req: Request, res: Response) => {
  try {
    const wantSrc = (req.query.sources as string)?.split(",").filter(Boolean) ?? SOURCES.map(s=>s.name);
    const wantCr  = (req.query.cryptos as string)?.split(",").filter(Boolean) ?? [];
    const wantBw  = (req.query.buzz    as string)?.split(",").filter(Boolean) ?? [];

    // Validate source names
    const invalidSources = wantSrc.filter(src => !SOURCES.some(s => s.name === src));
    if (invalidSources.length > 0) {
      logger.warn(`Invalid source(s): ${invalidSources.join(", ")}`);
      return res.status(400).json({
        error: `Invalid source(s): ${invalidSources.join(", ")}`
      });
    }

    // parallel scraping with timeout
    const timeout = 15000; // 15 seconds timeout
    const batches = await Promise.all(
      wantSrc.map(src =>
        Promise.race([
          scrapeOne(src),
          new Promise<Article[]>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout scraping ${src}`)), timeout)
          )
        ])
      )
    );

    let all: Article[] = batches.flat();

    // additional filtering if query params provided
    if (wantCr.length) {
      all = all.filter(a =>
        wantCr.some(k => a.title.toLowerCase().includes(k.toLowerCase()))
      );
    }
    if (wantBw.length) {
      all = all.filter(a =>
        wantBw.some(k => a.title.toLowerCase().includes(k.toLowerCase()))
      );
    }

    // Sort by source for consistent ordering
    all.sort((a, b) => a.source.localeCompare(b.source));

    res.json(all);
  } catch (e) {
    logger.error("Articles endpoint error:", e);
    res.status(500).json({
      error: "Failed to fetch articles"
    });
  }
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

app.listen(PORT, () => logger.info(`API ready on :${PORT}`));
