import { useEffect, useState } from "react";
import axios from "axios";

interface Article {
  title: string;
  url: string;
  source: string;
  image?: string;
}
interface Meta {
  sources: string[];
  cryptos: string[];
  buzzwords: string[];
}

export default function App() {
  /* ---------------- state ---------------- */
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selSources, setSelSources] = useState<string[]>([]);
  const [selCryptos, setSelCryptos] = useState<string[]>([]);
  const [selBuzz, setSelBuzz] = useState<string[]>([]);
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API = "/api"; // Using Vite's proxy

  /* ---------------- helpers ---------------- */
  const toggle = (arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const clearFilters = () => {
    setSelSources(meta?.sources || []);
    setSelCryptos([]);
    setSelBuzz([]);
  };

  /* ------------- fetch filter vocabulary ------------- */
  useEffect(() => {
    axios
      .get<Meta>(`${API}/meta`)
      .then((r) => {
        setMeta(r.data);
        setSelSources(r.data.sources); // pre‑select all news sources by default
      })
      .catch((e) => {
        console.error("/meta failed", e);
        setError("Failed to load filter options. Please try again later.");
      });
  }, []);

  /* ------------- search endpoint ------------- */
  const runSearch = async () => {
    if (!meta) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      // sources — include only if not "all"
      if (selSources.length && selSources.length !== meta.sources.length) {
        qs.append("sources", selSources.join(","));
      }
      if (selCryptos.length) qs.append("cryptos", selCryptos.join(","));
      if (selBuzz.length) qs.append("buzz", selBuzz.join(","));

      const { data } = await axios.get<Article[]>(`${API}/articles?${qs.toString()}`);
      setResults(data);
    } catch (e) {
      console.error("/articles failed", e);
      setError("Failed to fetch articles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!meta) return <p className="p-8 text-center text-gray-600">Loading filters…</p>;

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
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
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
            className="rounded-full bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow hover:bg-blue-700 transition-colors"
          >
            {loading ? "Searching..." : "Search"}
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
        {loading && <p className="text-center text-gray-500">Searching…</p>}
        {!loading && results.length === 0 && !error && (
          <p className="text-center text-gray-500">No results found. Try adjusting your filters.</p>
        )}
        <ul className="space-y-4">
          {results.map((a, i) => (
            <li key={i} className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md">
              {a.image && (
                <img
                  src={a.image}
                  alt={a.title}
                  className="mb-2 w-full max-h-48 object-cover rounded"
                  loading="lazy"
                />
              )}
              <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-blue-800">
                {a.source}
              </span>
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
function FilterBlock({ title, list, selected, setSelected, toggle }: FBProps) {
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
          >
            {v.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
