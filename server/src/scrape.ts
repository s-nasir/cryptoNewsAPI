import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
// import cheerio from "cheerio"; // work in progress

export interface Article {
  title: string;
  url:  string;
  source: string;
  // image?: string; // work in progress
}


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
  { name: "guardian", url: "https://www.theguardian.com/technology/cryptocurrencies", base: "https://www.theguardian.com" },
  { name: "bbc",      url: "https://www.bbc.com/news/topics/cyd7z4rvdm3t",           base: "https://www.bbc.com" },
  { name: "cnbc",     url: "https://www.cnbc.com/cryptoworld/",                      base: "https://www.cnbc.com" },
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

export async function scrapeOne(srcName: string): Promise<Article[]> {
  const src = SOURCES.find(s => s.name === srcName);
  if (!src) throw new Error(`Unknown source: ${srcName}`);

  // Setup axios with cookie jar and user-agent
  const jar = new CookieJar();
  const client = wrapper(axios.create());

  const { data } = await client.get<string>(src.url, {
    timeout: 10_000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    },
    jar
  });
  const links  = extractLinks(data);

  // keyword matching
  const wanted = [...CRYPTOS, ...BUZZWORDS];
  const hit = (txt: string) =>
    wanted.some(k => txt.toLowerCase().includes(k.toLowerCase()));

  // work in progress
  // Limit to first 5 articles for performance
  // const filteredLinks = links.filter(l => hit(l.text)).slice(0, 5);
  // const articles = await Promise.all(filteredLinks.map(async l => {
  //   const url = l.href.startsWith("http") ? l.href : new URL(l.href, src.base || src.url).href;
  //   const image = await fetchOgImage(url);
  //   return {
  //     title: l.text,
  //     url,
  //     source: src.name,
  //     image
  //   };
  // }));
  // return articles;

  return links
    .filter(l => hit(l.text))
    .map(l => ({
      title: l.text,
      url:   l.href.startsWith("http") ? l.href
             : new URL(l.href, src.base || src.url).href,
      source: src.name
    }));
}

