import { useEffect, useState, useCallback, memo } from "react";
import axios from "axios";

interface Article {
  title: string;
  url: string;
  source: string;
  image?: string;
  publishedAt?: string;
}

interface SearchResponse {
  articles: Article[];
  errors?: string[];
}

interface Meta {
  sources: string[];
  cryptos: string[];
  buzzwords: string[];
}

// Memoized FilterBlock component
const FilterBlock = memo(function FilterBlock({ title, list, selected, setSelected, toggle }: FBProps) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">{title}</h2>
      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
        {list.map((v) => (
          <button
            key={v}
            onClick={() => setSelected(toggle(selected, v))}
            className={`rounded-full border px-3 py-1 text-sm font-medium capitalize transition
              ${selected.includes(v) 
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700" 
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"}`}
            aria-pressed={selected.includes(v)}
          >
            {v.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
});

// Loading skeleton component
const ArticleSkeleton = () => (
  <div className="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
    <div className="h-48 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
  </div>
);

export default function App() {
  /* ---------------- state ---------------- */
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selSources, setSelSources] = useState<string[]>([]);
  const [selCryptos, setSelCryptos] = useState<string[]>([]);
  const [selBuzz, setSelBuzz] = useState<string[]>([]);
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Get API URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL;
  const API = API_URL || '/api';

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  /* ---------------- helpers ---------------- */
  const toggle = useCallback((arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v], []);

  const clearFilters = useCallback(() => {
    setSelSources(meta?.sources || []);
    setSelCryptos([]);
    setSelBuzz([]);
  }, [meta?.sources]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle scroll events for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ------------- fetch filter vocabulary ------------- */
  useEffect(() => {
    setMetaLoading(true);
    axios
      .get<Meta>(`${API}/meta`)
      .then((r) => {
        setMeta(r.data);
        setSelSources(r.data.sources);
      })
      .catch((e) => {
        console.error("/meta failed", e);
        setError("Failed to load filter options. Please try again later.");
      })
      .finally(() => {
        setMetaLoading(false);
      });
  }, [API]);

  /* ------------- search endpoint ------------- */
  const runSearch = useCallback(async () => {
    if (!meta) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (selSources.length && selSources.length !== meta.sources.length) {
        qs.append("sources", selSources.join(","));
      }
      if (selCryptos.length) qs.append("cryptos", selCryptos.join(","));
      if (selBuzz.length) qs.append("buzz", selBuzz.join(","));

      const { data } = await axios.get<SearchResponse>(`${API}/articles?${qs.toString()}`);
      setResults(data.articles);
      if (data.errors?.length) {
        setError(data.errors.join('\n'));
      }
    } catch (e) {
      console.error("/articles failed", e);
      setError("Failed to fetch articles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API, meta, selSources, selCryptos, selBuzz]);

  if (metaLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (!meta) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="p-8 text-center text-red-600">Failed to load filters. Please refresh the page.</p>
    </div>
  );

  /* ---------------- UI ---------------- */
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-50 px-4 md:px-12 py-10 font-sans">
      <h1 className="mb-8 text-4xl font-semibold text-blue-600">Crypto‑News Explorer</h1>

      {/* main filter container */}
      <div className="w-full max-w-full mx-auto rounded-lg border bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">Filter Options</h2>
          <button
            onClick={clearFilters}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* filter grids */}
        <div className="grid gap-6 md:grid-cols-3">
          <FilterBlock
            title="News Sources"
            list={meta.sources}
            selected={selSources}
            setSelected={setSelSources}
            toggle={toggle}
          />
          <FilterBlock
            title="Cryptocurrencies"
            list={meta.cryptos}
            selected={selCryptos}
            setSelected={setSelCryptos}
            toggle={toggle}
          />
          <FilterBlock
            title="Buzzwords"
            list={meta.buzzwords}
            selected={selBuzz}
            setSelected={setSelBuzz}
            toggle={toggle}
          />
        </div>

        {/* search button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={runSearch}
            disabled={loading}
            className="rounded-full bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : "Search"}
          </button>
        </div>
      </div>

      {/* results */}
      <div className="mt-10 w-full max-w-full mx-auto">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <ArticleSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && results.length === 0 && !error && (
          <p className="text-center text-gray-500">No results found. Try adjusting your filters.</p>
        )}
        <ul className="space-y-4">
          {results.map((a, i) => (
            <li key={i} className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md">
              {a.image && !imageErrors.has(i) && (
                <img
                  src={a.image}
                  alt={a.title}
                  className="mb-2 w-full max-h-48 object-cover rounded"
                  loading="lazy"
                  onError={() => setImageErrors(prev => new Set([...prev, i]))}
                />
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-blue-800">
                  {a.source}
                </span>
                {a.publishedAt && (
                  <span className="text-sm text-gray-500">
                    {new Date(a.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-lg font-medium leading-snug text-blue-700 hover:underline"
              >
                {a.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Back to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Back to top"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ---------------- reusable filter block ---------------- */
interface FBProps {
  title: string;
  list: string[];
  selected: string[];
  setSelected: (arr: string[]) => void;
  toggle: (arr: string[], v: string) => string[];
}
