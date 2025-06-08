import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import winston from "winston";
import compression from "compression";
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
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Add compression middleware
app.use(compression());

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Input validation
    if (wantSrc.length > 20) {
      return res.status(400).json({
        error: "Too many sources requested. Maximum is 20 sources."
      });
    }

    if (wantCr.length > 50) {
      return res.status(400).json({
        error: "Too many cryptocurrencies requested. Maximum is 50."
      });
    }

    if (wantBw.length > 50) {
      return res.status(400).json({
        error: "Too many buzzwords requested. Maximum is 50."
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
    const requestTimeout = 20000; 
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), requestTimeout);
    });

    // parallel scraping with timeout
    const scrapeTimeout = 16000; 
    const scrapePromises = wantSrc.map(src =>
      Promise.race([
        scrapeOne(src),
        new Promise<Article[]>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout scraping ${src}`)), scrapeTimeout)
        )
      ])
    );

    const batches = await Promise.race([
      Promise.allSettled(scrapePromises),
      timeoutPromise
    ]) as PromiseSettledResult<Article[]>[];

    // Process results and handle errors
    let all: Article[] = [];
    const errors: string[] = [];
    
    batches.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        all = all.concat(result.value);
      } else {
        const error = result.reason instanceof Error ? result.reason.message : 'Unknown error';
        errors.push(`Failed to scrape ${wantSrc[index]}: ${error}`);
        logger.error(`Failed to scrape ${wantSrc[index]}:`, result.reason);
      }
    });

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

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedArticles = all.slice(startIndex, endIndex);

    logger.info(`Returning ${paginatedArticles.length} articles (page ${page})`);
    res.json({
      articles: paginatedArticles,
      total: all.length,
      page,
      totalPages: Math.ceil(all.length / limit),
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    logger.error("Articles endpoint error:", e);
    res.status(500).json({
      error: "Failed to fetch articles",
      details: e instanceof Error ? e.message : "Unknown error"
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
