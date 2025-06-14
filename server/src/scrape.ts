import axios from "axios";
import winston from "winston";
import { JSDOM } from "jsdom";
// import cheerio from "cheerio"; // work in progress

// logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.printf(({ level, message }) => `${level}: ${message}`)
    }),
  ],
  exitOnError: false 
});

export interface Article {
  title: string;
  url:  string;
  source: string;
  // image?: string; // work in progress
}

function extractLinks(html: string): {text: string; href: string}[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const links: {text: string; href: string}[] = [];
  
  document.querySelectorAll('a').forEach(link => {
    const text = link.textContent?.trim();
    const href = link.getAttribute('href');
    if (text && href) {
      links.push({ text, href });
    }
  });
  
  return links;
}

export const SOURCES = [
  // { name: "guardian", url: "https://www.theguardian.com/technology/cryptocurrencies", base: "https://www.theguardian.com" },
  { name: "bbc",      url: "https://www.bbc.com/news/topics/cyd7z4rvdm3t",           base: "https://www.bbc.com" },
  // { name: "cnbc",     url: "https://www.cnbc.com/cryptoworld/",                      base: "https://www.cnbc.com" },
  { name: "times-now-crypto", url: "https://www.timesnownews.com/topic/crypto", base: "https://www.timesnownews.com" },
  { name: "forbes-crypto", url: "https://www.forbes.com/crypto-blockchain/?sh=5da619802b6e", base: "https://www.forbes.com" },
  { name: "fox-news-crypto", url: "https://www.foxbusiness.com/category/cryptocurrency", base: "https://www.foxbusiness.com" },
  { name: "al-jazeera-crypto", url: "https://www.aljazeera.com/tag/crypto/", base: "https://www.aljazeera.com" },
  { name: "new-york-times-crypto", url: "https://www.nytimes.com/spotlight/cryptocurrency", base: "https://www.nytimes.com" },
  { name: "reuters-crypto", url: "https://www.reuters.com/business/future-of-money/", base: "https://www.reuters.com" },
  { name: "globe-and-mail-crypto", url: "https://www.theglobeandmail.com/topics/cryptocurrency/", base: "https://www.theglobeandmail.com" },
  { name: "buzzfeed-crypto", url: "https://www.buzzfeed.com/ca/tag/cryptocurrency", base: "https://www.buzzfeed.com" },
  { name: "cnn-crypto", url: "https://www.cnn.com/specials/investing/cryptocurrency", base: "https://www.cnn.com" },
  { name: "rt-crypto", url: "https://www.rt.com/trends/cryptocurrency-cryptographic-exchange-bitcoin/", base: "https://www.rt.com" },
  // { name: "france-24-crypto", url: "https://www.france24.com/en/tag/cryptocurrency/", base: "https://www.france24.com" },
  { name: "global-news-crypto", url: "https://globalnews.ca/tag/cryptocurrency/", base: "https://globalnews.ca" },
  { name: "sydney-morning-herald-crypto", url: "https://www.smh.com.au/topic/cryptocurrencies-hpc", base: "https://www.smh.com.au" },
  { name: "sky-crypto", url: "https://news.sky.com/topic/cryptocurrencies-7226", base: "https://news.sky.com" },
  { name: "the-sun-crypto", url: "https://www.thesun.co.uk/topic/cryptocurrency/", base: "https://www.thesun.co.uk" },
];

export const CRYPTOS   = ["bitcoin","ethereum","cardano","dogecoin","binance","shiba","ftx","ada","btc","eth"];
export const BUZZWORDS = ["bullish","bearish","stocks","depreciation","regulation","high value"];

// async function fetchOgImage(url: string): Promise<string | undefined> { // work in progress
//   try {
//     const { data } = await axios.get(url, { timeout: 10000 });
//     const $ = cheerio.load(data);
//     const ogImage = $('meta[property="og:image"]').attr('content');
//     return ogImage;
//   } catch {
//     return undefined;
//   }
// } // work in progress

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(url: string, base: string): string {
  try {
    if (url.startsWith('http')) {
      return url;
    }
    return new URL(url, base).href;
  } catch {
    return base;
  }
}

async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

export async function scrapeOne(srcName: string): Promise<Article[]> {
  try {
    const src = SOURCES.find(s => s.name === srcName);
    if (!src) throw new Error(`Unknown source: ${srcName}`);

    const { data } = await retry(() => axios.get<string>(src.url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 300,
      transformResponse: [(data) => {
        if (typeof data !== 'string') {
          throw new Error('Invalid response type');
        }
        return data;
      }],
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      responseType: 'text'
    }));

    if (typeof data !== 'string') {
      throw new Error('Invalid response data type');
    }

    const links = extractLinks(data);
    const wanted = [...CRYPTOS, ...BUZZWORDS];
    const hit = (txt: string) =>
      wanted.some(k => txt.toLowerCase().includes(k.toLowerCase()));

    const filteredLinks = links
      .filter(l => hit(l.text))
      .map(l => {
        const url = normalizeUrl(l.href, src.base || src.url);
        return {
          title: l.text,
          url: isValidUrl(url) ? url : src.url,
          source: src.name
        };
      })
      .filter(l => isValidUrl(l.url));

    if (filteredLinks.length > 0) {
      logger.info(`${srcName}: ${filteredLinks.length} articles found`);
    }
    return filteredLinks;
  } catch (error) {
    logger.error(`${srcName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

