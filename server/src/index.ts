import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
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
    // Console transport
    new winston.transports.Console({
      format: winston.format.printf(({ level, message }) => `${level}: ${message}`)
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'logs/api.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Separate file for error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  exitOnError: false // Prevent memory leaks
});

// Helper function to limit error message length
const limitErrorLength = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 150 ? message.substring(0, 147) + '...' : message;
};

// Memory management
const MAX_ARTICLES_PER_SOURCE = 50; // Limit articles per source
const BATCH_SIZE = 1000; // Process articles in batches

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

app.get("/meta", (_, res) => {
  try {
    res.json({
      sources: SOURCES.map(s => s.name),
      cryptos: CRYPTOS,
      buzzwords: BUZZWORDS
    });
  } catch (e) {
    logger.error(`Meta endpoint error: ${limitErrorLength(e)}`);
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

    // Validate source names
    const invalidSources = wantSrc.filter(src => !SOURCES.some(s => s.name === src));
    if (invalidSources.length > 0) {
      return res.status(400).json({
        error: `Invalid source(s): ${invalidSources.join(", ")}`
      });
    }

    // Set overall request timeout
    const requestTimeout = 20000; // 20 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), requestTimeout);
    });

    // parallel scraping with timeout
    const scrapeTimeout = 8000; // 8 seconds timeout per source
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
    
    // Process results in batches to manage memory
    for (let i = 0; i < batches.length; i++) {
      const result = batches[i];
      if (result.status === 'fulfilled') {
        // Limit articles per source
        const articles = result.value.slice(0, MAX_ARTICLES_PER_SOURCE);
        all = all.concat(articles);
      } else {
        const error = limitErrorLength(result.reason);
        errors.push(`Failed to scrape ${wantSrc[i]}: ${error}`);
      }
    }

    // Process filtering in batches
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
      }
      all = filtered;
    }

    // Sort by source for consistent ordering
    all.sort((a, b) => a.source.localeCompare(b.source));

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const totalTime = seconds + nanoseconds / 1e9;
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
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
    
    logger.error(`Articles endpoint error after ${totalTime.toFixed(2)}s: ${limitErrorLength(e)}`);
    res.status(500).json({
      error: "Failed to fetch articles",
      details: limitErrorLength(e),
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
  logger.error(`Unhandled error: ${limitErrorLength(err)}`);
  res.status(500).json({ 
    error: "Internal server error",
    details: limitErrorLength(err)
  });
};
app.use(errorHandler);

app.listen(PORT, () => logger.info(`API ready on :${PORT}`));
