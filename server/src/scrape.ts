import axios from "axios";

export interface Article {
  title: string;
  url:  string;
  source: string;
}

/**
 * Regex‑based link extractor.
 * NOTE:   This is deliberately simple and library‑free.
 */
function extractLinks(html: string): {text: string; href: string}[] {
  const links: {text: string; href: string}[] = [];
  const rx = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gim;

  let m: RegExpExecArray | null;
  while ((m = rx.exec(html))) {
    const [, href, raw] = m;
    const text = raw.replace(/<[^>]+>/g, "").trim();
    links.push({ text, href });
  }
  return links;
}

export const SOURCES = [
  { name: "guardian", url: "https://www.theguardian.com/technology/cryptocurrencies", base: "" },
  { name: "bbc",      url: "https://www.bbc.com/news/topics/cyd7z4rvdm3t",           base: "https://www.bbc.com" },
  { name: "cnbc",     url: "https://www.cnbc.com/cryptoworld/",                      base: "" },
  // …add as needed
];

export const CRYPTOS   = ["bitcoin","ethereum","cardano","dogecoin","binance","shiba","ftx","ada","btc","eth"];
export const BUZZWORDS = ["bullish","bearish","stocks","depreciation","regulation","high value"];

export async function scrapeOne(srcName: string): Promise<Article[]> {
  const src = SOURCES.find(s => s.name === srcName);
  if (!src) throw new Error(`Unknown source: ${srcName}`);

  const { data } = await axios.get<string>(src.url, { timeout: 10_000 });
  const links  = extractLinks(data);

  // keyword matching
  const wanted = [...CRYPTOS, ...BUZZWORDS];
  const hit = (txt: string) =>
    wanted.some(k => txt.toLowerCase().includes(k.toLowerCase()));

  return links
    .filter(l => hit(l.text))
    .map(l => ({
      title: l.text,
      url:   l.href.startsWith("http") ? l.href
             : new URL(l.href, src.base || src.url).href,
      source: src.name
    }));
}

