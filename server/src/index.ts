import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import winston from "winston";
import { scrapeOne, SOURCES, CRYPTOS, BUZZWORDS, Article } from "./scrape";

dotenv.config();

// Winston logger setup with memory-efficient configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple() // Use simple format to reduce memory usage
    }),
  ],
});

// Memory management
const MAX_ARTICLES_PER_SOURCE = 25; // Reduced from 50
const BATCH_SIZE = 500; // Reduced from 1000
const MAX_TOTAL_ARTICLES = 200; // New limit for total articles

const app = express();
const PORT = process.env.PORT || 9000;

// Security middlewares
app.use(helmet());
app.use(cors({ 
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://crypto-news-explorer.vercel.app',
      'https://crypto-news-explorer.vercel.app/'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Use compression for all responses
app.use(express.json());

// Memory monitoring middleware
app.use((req, res, next) => {
  const used = process.memoryUsage();
  if (used.heapUsed > 200 * 1024 * 1024) { // 200MB threshold
    logger.warn('High memory usage detected:', {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
    });
    if (global.gc) {
      global.gc();
    }
  }
  next();
});

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
  const startTime = process.hrtime();
  try {
    const wantSrc = (req.query.sources as string)?.split(",").filter(Boolean) ?? SOURCES.map(s=>s.name);
    const wantCr  = (req.query.cryptos as string)?.split(",").filter(Boolean) ?? [];
    const wantBw  = (req.query.buzz    as string)?.split(",").filter(Boolean) ?? [];

    // Input validation
    if (wantSrc.length > 10) { // Reduced from 20
      return res.status(400).json({
        error: "Too many sources requested. Maximum is 10 sources."
      });
    }

    if (wantCr.length > 25) { // Reduced from 50
      return res.status(400).json({
        error: "Too many cryptocurrencies requested. Maximum is 25."
      });
    }

    if (wantBw.length > 25) { // Reduced from 50
      return res.status(400).json({
        error: "Too many buzzwords requested. Maximum is 25."
      });
    }

    logger.info(`Processing request with sources: ${wantSrc.join(', ')}`);

    // Validate source names
    const invalidSources = wantSrc.filter(src => !SOURCES.some(s => s.name === src));
    if (invalidSources.length > 0) {
      logger.warn(`Invalid source(s): ${invalidSources.join(", ")}`);
      return res.status(400).json({
        error: `Invalid source(s): ${invalidSources.join(", ")}`
      });
    }

    // Set overall request timeout
    const requestTimeout = 15000; // Reduced from 20000
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), requestTimeout);
    });

    // Process sources sequentially to reduce memory usage
    let all: Article[] = [];
    const errors: string[] = [];
    
    for (const src of wantSrc) {
      try {
        const articles = await Promise.race([
          scrapeOne(src),
          new Promise<Article[]>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout scraping ${src}`)), 8000)
          )
        ]);
        
        // Limit articles per source
        const limitedArticles = articles.slice(0, MAX_ARTICLES_PER_SOURCE);
        all = all.concat(limitedArticles);
        
        // Check total articles limit
        if (all.length >= MAX_TOTAL_ARTICLES) {
          all = all.slice(0, MAX_TOTAL_ARTICLES);
          logger.warn(`Reached maximum article limit of ${MAX_TOTAL_ARTICLES}`);
          break;
        }
        
        // Force garbage collection after each source
        if (global.gc) {
          global.gc();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to scrape ${src}: ${errorMessage}`);
        logger.error(`Failed to scrape ${src}:`, error);
      }
    }

    // Process filtering in smaller batches
    if (wantCr.length || wantBw.length) {
      const filtered: Article[] = [];
      for (let i = 0; i < all.length; i += BATCH_SIZE) {
        const batch = all.slice(i, i + BATCH_SIZE);
        const filteredBatch = batch.filter(a => {
          const title = a.title.toLowerCase();
          const hasCrypto = !wantCr.length || wantCr.some(k => title.includes(k.toLowerCase()));
          const hasBuzz = !wantBw.length || wantBw.some(k => title.includes(k.toLowerCase()));
          return hasCrypto && hasBuzz;
        });
        filtered.push(...filteredBatch);
        
        // Force garbage collection after each batch
        if (global.gc) {
          global.gc();
        }
      }
      all = filtered;
    }

    // Sort by source for consistent ordering
    all.sort((a, b) => a.source.localeCompare(b.source));

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const totalTime = seconds + nanoseconds / 1e9;
    
    // Final garbage collection
    if (global.gc) {
      global.gc();
    }
    
    logger.info(`Returning ${all.length} articles in ${totalTime.toFixed(2)} seconds`);
    res.json({
      articles: all,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        totalArticles: all.length,
        timeElapsed: totalTime.toFixed(2),
        errorCount: errors.length
      }
    });
  } catch (e) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const totalTime = seconds + nanoseconds / 1e9;
    
    logger.error(`Articles endpoint error after ${totalTime.toFixed(2)} seconds:`, e);
    res.status(500).json({
      error: "Failed to fetch articles",
      details: e instanceof Error ? e.message : "Unknown error",
      meta: {
        totalArticles: 0,
        timeElapsed: totalTime.toFixed(2),
        errorCount: 1
      }
    });
  }
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    details: err instanceof Error ? err.message : "Unknown error"
  });
};
app.use(errorHandler);

app.listen(PORT, () => logger.info(`API ready on :${PORT}`));
