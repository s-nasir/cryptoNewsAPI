// --------------------------------------------

//* Declaring Constants

const PORT = process.env.PORT || 9000;
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

// --------------------------------------------

//* Setting Routes

app.get("/", (req, res) => {
  res.json("Welcome to Crypto news API");
});

app.listen(PORT, () => console.log(`server running on ${PORT}`));

// --------------------------------------------

//* Setting up arrays

//* Storing News source info
const newsSrc = [
  {
    name: "The-Guardian-Crypto",
    address: "https://www.theguardian.com/technology/cryptocurrencies",
    base: "",
  },
  {
    name: "CNBC-Crypto-World",
    address: "https://www.cnbc.com/cryptoworld/",
    base: "",
  },
  {
    name: "Times-Now-Crypto",
    address: "https://www.timesnownews.com/topic/crypto",
    base: "https://www.timesnownews.com",
  },
  {
    name: "Forbes-Crypto",
    address: "https://www.forbes.com/crypto-blockchain/?sh=5da619802b6e",
    base: "",
  },
  {
    name: "BBC-Crypto",
    address: "https://www.bbc.com/news/topics/cyd7z4rvdm3t",
    base: "https://www.bbc.com",
  },
  {
    name: "FOX-News-Crypto",
    address: "https://www.foxbusiness.com/category/cryptocurrency",
    base: "https://www.foxbusiness.com",
  },
  {
    name: "Al-Jazeera-Crypto",
    address: "https://www.aljazeera.com/tag/crypto/",
    base: "*",
  },
  {
    name: "New-York-Times-Crypto",
    address: "https://www.nytimes.com/spotlight/cryptocurrency",
    base: "https://www.nytimes.com",
  },
  {
    name: "Reuters-Crypto",
    address: "https://www.reuters.com/business/future-of-money/",
    base: "https://www.reuters.com",
  },
  {
    name: "Globe-&-Mail-Crypto",
    address: "https://www.theglobeandmail.com/topics/cryptocurrency/",
    base: "https://www.theglobeandmail.com",
  },
  {
    name: "BuzzFeed-Crypto",
    address: "https://www.buzzfeed.com/ca/tag/cryptocurrency",
    base: "",
  },
  {
    name: "CNN-Crypto",
    address: "https://www.cnn.com/specials/investing/cryptocurrency",
    base: "*",
  },
  {
    name: "RT-Crypto",
    address:
      "https://www.rt.com/trends/cryptocurrency-cryptographic-exchange-bitcoin/",
    base: "https://www.rt.com",
  },
  {
    name: "France-24-Crypto",
    address: "https://www.france24.com/en/tag/cryptocurrency/",
    base: "https://www.france24.com",
  },
  {
    name: "Global-News-Crypto",
    address: "https://globalnews.ca/tag/cryptocurrency/",
    base: "",
  },
  {
    name: "Sydney-Morning-Herald-Crypto",
    address: "https://www.smh.com.au/topic/cryptocurrencies-hpc",
    base: "https://www.smh.com.au",
  },
  {
    name: "sky-Crypto",
    address: "https://news.sky.com/topic/cryptocurrencies-7226",
    base: "https://news.sky.com",
  },
  {
    name: "The-Sun-Crypto",
    address: "https://www.thesun.co.uk/topic/cryptocurrency/",
    base: "",
  },
];

// --------------------------------------------
//! -------------------------------------------- exprimental
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

const keywords = [
  "crypto",
  "bitcoin",
  "FTX",
  "shiba",
  "DOGE",
  "cryptocurrency",
  "binance",
  "dogecoin",
  "ethereum",
  "Cardano",
  "ADA",
  "ETH",
  "BTC",
  "LRC",
  "AAVE",
  "Amp",
  "ANKR",
];

app.get("/news", async (req, res) => {
  const articles = [];

  for (const source of newsSrc) {
    if (source.address && isValidUrl(source.address)) {
      try {
        const response = await axios.get(source.address);
        const html = response.data;
        const $ = cheerio.load(html);

        keywords.forEach((keyword) => {
          $(`a:contains("${keyword}")`).each(function () {
            const title = $(this).text();
            const url = $(this).attr("href");

            articles.push({
              title,
              url: source.base + url,
              source: source.name,
            });
          });
        });
      } catch (error) {
        console.error(`Failed to scrape ${source.address}: ${error}`);
      }
    }
  }

  res.json(articles);
});

app.get("news/:newspaperID", async (req, res) => {
  const newspaperId = req.params.newspaperId;

  const selectiveArticles = [];

  const newspaperAddress = newsSrc.filter(
    (newsSrc) => newsSrc.name == newspaperId
  )[0].address;
  const newspaperBase = newsSrc.filter(
    (newsSrc) => newsSrc.name == newspaperId
  )[0].base;

  if (newspaperAddress && isValidUrl(newspaperAddress)) {
    try {
      const response = await axios.get(newspaperAddress);
      const html = response.data;
      const $ = cheerio.load(html);

      keywords.forEach((keyword) => {
        $(`a:contains("${keyword}")`).each(function () {
          const title = $(this).text();
          const url = $(this).attr("href");

          selectiveArticles.push({
            title,
            url: newspaperBase + url,
            source: newspaperId,
          });
        });
      });
    } catch (error) {
      console.error(`Failed to scrape ${newspaperAddress}: ${error}`);
    }
  }
  res.json(selectiveArticles);
});

//*Keyword Scraping functions for specific source

// app.get('/news/:newspaperId', (req, res) => {
//         const newspaperId = req.params.newspaperId

//         const newspaperAddress = newsSrc.filter(newsSrc => newsSrc.name == newspaperId)[0].address
//         const newspaperBase = newsSrc.filter(newsSrc => newsSrc.name == newspaperId)[0].base

//         axios.get(newspaperAddress)
//             .then(response => {
//                 const html = response.data
//                 const $ = cheerio.load(html)
//                 const selectiveArticles = []

//                 $('a:contains("crypto")', html).each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr('href')
//                     selectiveArticles.push({
//                         title,
//                         url: newspaperBase + url,
//                         source: newspaperId,
//                     })
//                 })
//                 $('a:contains("bitcoin")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("FTX")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("shiba")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("DOGE")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("cryptocurrency")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("binance")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("dogecoin")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("ethereum")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("Cardano")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("ADA")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("ETH")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("BTC")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("LRC")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("AAVE")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("Amp")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 $('a:contains("ANKR")').each(function() {
//                     const title = $(this).text()
//                     const url = $(this).attr("href")

//                     articles.push({
//                         title,
//                         url: newsSrc.base + url,
//                         source: newsSrc.name
//                     })
//                 })
//                 res.json(selectiveArticles)
//             }).catch((error) => console.log(error))
//     })
