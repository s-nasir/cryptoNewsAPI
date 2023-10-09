# Crypto News Query API

---

## Overview

The Crypto News Query API is a powerful web search tool designed to aggregate cryptocurrency news articles from 18 renowned international news sources. It provides access to article titles, URLs, and their respective source websites, making it a valuable resource for staying up-to-date with the latest developments in the cryptocurrency world. The goal is to promote and make trusted information available easy to lessen the current trend of false information effecting the Crypto market stocks.

## Problem & Solution

In the current era, cryptocurrency has seen a surge in popularity, with a majority of individuals showing varying degrees of interest in investing in this digital asset. Regrettably, this interest is often fueled by unrealistic expectations of cryptocurrency's future, leading to a lack of understanding of its historical use by criminals due to its untraceable nature [[1]](https://news.harvard.edu/gazette/story/2021/09/regulating-the-unregulated-cryptocurrency-market/).

Cryptocurrency's volatile and untraceable nature has resulted in numerous instances of fraud, leading to substantial losses. In addition, fake news about the rising value of cryptocurrencies has been prevalent, often promoted by numerous unverified "crypto gurus". This has led to small-time investors making hasty investment decisions, causing market fluctuations and ultimately leading to a cash out by all investors, further contributing to the volatility of cryptocurrencies [[2]](https://www.wsj.com/articles/crypto-frauds-target-investors-hoping-to-cash-in-on-bitcoin-boom-11623058380).

To address the issue of fake news sources, I have developed an API that allows website and blog owners to obtain real-time news from trusted sources. It's important to note that "trusted" does not necessarily mean the news itself is authentic. Rather, the sources are trusted by the majority in their respective regions, thus qualifying as trusted. Despite the volatility and unpredictability of the cryptocurrency market, caution is advised for those using the API [[3]](https://www.ftc.gov/business-guidance/blog/2022/06/reported-crypto-scam-losses-2021-top-1-billion-says-ftc-data-spotlight).

Here is an article by Federal Trade Commission (An official website of the United States government) [[4]](https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams) which provides an in depth review on cryptocurrencies. 


## Key Features

- **Customized Keyword Search**: The API utilizes niche-specific keywords, carefully tailored to yield over 200 search results from a select pool of 18 trusted news sources. 

- **Real-Time Updates**: Built with Node.js and Express.js, the API employs the Cheerio website scanning package to enable dynamic functionality. This ensures that users receive real-time article updates with a simple page refresh.

- **Flexible Filtering**: The API offers flexibility in filtering search results based on selected sources or specific keywords, allowing users to pinpoint the information that matters most to them.

## How to Use

### Retrieve Crypto News Articles

To retrieve cryptocurrency news articles, make a GET request to the `/news` endpoint. This will provide you with a list of articles from various sources that match the predefined keywords.

### Retrieve Articles from a Specific Source

To fetch articles from a specific news source, make a GET request to the `/news/:newspaperID` endpoint, where `:newspaperID` should be replaced with the desired source's identifier (e.g., "The-Guardian-Crypto"). This will give you a list of articles from the chosen source.

### Retrieve Articles for a Specific Keyword 

To retrieve articles on a specific keyword, make a GET request to the `/keyword` endpoint, where `keyword` should be replaced with a defined keyword from the keyword filter list provided by the author. This will fetch you all the articles for the chosen keyword from defined news sources.

## Project Details

- **Development Stack**: Node.js, Express.js, Axios, Cheerio

- **Data Sources**: The API scrapes articles from 18 international news sources known for their cryptocurrency coverage.

## Conclusion

The Crypto News Query API represents a robust solution for accessing real-time cryptocurrency news. Its flexibility in searching, filtering, and dynamic updates ensures that users can stay informed in an ever-evolving crypto landscape. Whether you're a developer looking to integrate crypto news into your application or a cryptocurrency enthusiast seeking the latest updates, this API has you covered.

---
