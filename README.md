# Crypto News Query API

---

## Overview

The Crypto News Query API is a powerful web search tool designed to aggregate cryptocurrency news articles from 18 renowned international news sources. It provides access to article titles, URLs, and their respective source websites, making it a valuable resource for staying up-to-date with the latest developments in the cryptocurrency world.

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
