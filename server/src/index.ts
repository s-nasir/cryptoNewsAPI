import express from "express";
import cors    from "cors";
import { scrapeOne, SOURCES, CRYPTOS, BUZZWORDS, Article } from "./scrape";

const app  = express();
const PORT = process.env.PORT || 9000;
app.use(cors());

// meta endpoint – lets the UI build filter lists dynamically
app.get("/meta", (_, res) => {
  res.json({ sources: SOURCES.map(s => s.name), cryptos: CRYPTOS, buzzwords: BUZZWORDS });
});

/**
 * GET /articles
 *    ?sources=bbc,guardian
 *    &cryptos=bitcoin,eth
 *    &buzz=stocks,bullish
 */
app.get("/articles", async (req, res) => {
  const wantSrc = (req.query.sources as string)?.split(",").filter(Boolean) ?? SOURCES.map(s=>s.name);
  const wantCr  = (req.query.cryptos as string)?.split(",").filter(Boolean) ?? [];
  const wantBw  = (req.query.buzz    as string)?.split(",").filter(Boolean) ?? [];

  try {
    // parallel scraping
    const batches = await Promise.all(wantSrc.map(scrapeOne));
    let all: Article[] = batches.flat();

    // additional filtering if query params provided
    if (wantCr.length)
      all = all.filter(a => wantCr.some(k => a.title.toLowerCase().includes(k)));
    if (wantBw.length)
      all = all.filter(a => wantBw.some(k => a.title.toLowerCase().includes(k)));

    res.json(all);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Scraping failed" });
  }
});

app.listen(PORT, () => console.log(`API ready on :${PORT}`));
