# Crypto News Explorer

Crypto News Explorer is a full-stack web application for discovering and filtering the latest cryptocurrency news from multiple sources. It features a custom-built backend scraper and a modern React frontend, allowing users to filter news by source, cryptocurrency, and buzzwords.

---

## Features
- **Aggregates crypto news** from multiple reputable sources
- **Custom backend scraper** for real-time article extraction
- **Three filter categories:**
  - News Source
  - Type of Crypto
  - Buzzwords
- **Modern frontend** built with React, TypeScript, Tailwind CSS, and Vite
- **Responsive UI** for desktop and mobile
- **API-driven architecture**

---

## Project Structure

```
cryptoNewsAPI/
├── client/   # React + Vite frontend
├── server/   # Node.js + Express backend scraper API
└── README.md
```

---

## How It Works

### Backend Scraper Logic

The backend is a Node.js/Express API that scrapes and serves crypto news articles using the following logic:

1. **Web Scraping**
   - Fetches HTML from each news source using Axios.
   - Extracts all `<a>` (anchor) tags from the HTML using a regular expression to find article links.

2. **Data Filtering**
   - Filters extracted links to retain only those whose text contains user-specified cryptocurrency names or buzzwords.
   - This ensures only relevant articles are returned.

3. **URL Normalization**
   - Converts relative URLs to absolute URLs using the source's base URL, ensuring all article links are valid and clickable.

4. **Parallel Scraping**
   - Fetches data from multiple sources concurrently for fast response times.

5. **Result Formatting**
   - Returns a structured list of articles, each with a title, URL, and source name.

**Data Science Logic Overview:**
- **Data Retrieval:** Scrapes structured data from unstructured web pages.
- **Data Filtering:** Filters articles by user-defined keywords (cryptos/buzzwords).
- **Data Transformation:** Normalizes and formats data for frontend consumption.
- **Optimization:** Uses parallel processing for efficient data retrieval.

### API Endpoints
- `GET /meta` — Returns available sources, cryptos, and buzzwords for filters.
- `GET /articles` — Returns filtered articles based on query parameters:
  - `sources` (comma-separated)
  - `cryptos` (comma-separated)
  - `buzz` (comma-separated)

---

### Frontend
- Built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**
- Fetches filter options and articles from the backend API
- Allows users to filter news by source, crypto, and buzzword
- Responsive, modern UI

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Setup

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/cryptoNewsAPI.git
cd cryptoNewsAPI
```

#### 2. Install dependencies
```bash
cd server
npm install
cd ../client
npm install
```

#### 3. Environment Variables
- **Backend (`server/.env`):**
  ```env
  PORT=9000
  FRONTEND_URL=http://localhost:5173
  ```
- **Frontend (`client/.env` or `.env.production`):**
  ```env
  VITE_API_URL=http://localhost:9000
  ```

#### 4. Run the app locally
- **Backend:**
  ```bash
  cd server
  npm run dev
  ```
- **Frontend:**
  ```bash
  cd client
  npm run dev
  ```

---

## Deployment

- **Frontend:** Deploy the `client` folder to Vercel, Netlify, or similar static hosting.
- **Backend:** Deploy the `server` folder to Render, Railway, Fly.io, or similar Node.js hosting.
- Set environment variables for production URLs as needed.

---

## License
MIT

---

## Credits
Crypto News Explorer — built with ❤️ using Node.js, Express, React, TypeScript, and Tailwind CSS.

---
