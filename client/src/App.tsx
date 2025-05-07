import { useEffect, useState } from "react";
import axios from "axios";

interface Article {
  title: string;
  url: string;
  source: string;
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

  const API = import.meta.env.VITE_API_URL || "http://localhost:9000";

  /* ---------------- helpers ---------------- */
  const toggle = (arr: string[], v: string): string[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  /* ------------- fetch filter vocabulary ------------- */
  useEffect(() => {
    axios
      .get<Meta>(`${API}/meta`)
      .then((r) => {
        setMeta(r.data);
        setSelSources(r.data.sources); // pre‑select all news sources by default
      })
      .catch((e) => console.error("/meta failed", e));
  }, []);

  /* ------------- search endpoint ------------- */
  const runSearch = async () => {
    if (!meta) return;
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  /* auto search when filters change (optional). Comment out if undesired */
  // useEffect(() => { if (meta) runSearch(); }, [selSources, selCryptos, selBuzz]);

  if (!meta) return <p className="p-8 text-center text-gray-600">Loading filters…</p>;

  /* ---------------- UI ---------------- */
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10 font-sans">
      <h1 className="mb-8 text-4xl font-semibold text-blue-600">Crypto‑News Explorer</h1>

      {/* filter grids */}
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        <FilterBlock
          title="Sources"
          list={meta.sources}
          selected={selSources}
          setSelected={setSelSources}
          toggle={toggle}
        />
        <FilterBlock
          title="Cryptos"
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
      <button
        onClick={runSearch}
        className="mt-8 rounded-full bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700"
      >
        Search
      </button>

      {/* results */}
      <div className="mt-10 w-full max-w-3xl">
        {loading && <p className="text-center text-gray-500">Searching…</p>}
        {!loading && results.length === 0 && (
          <p className="text-center text-gray-500">No results yet. Adjust filters and click Search.</p>
        )}
        <ul className="space-y-4">
          {results.map((a, i) => (
            <li key={i} className="rounded border bg-white p-4 shadow-sm transition hover:shadow">
              <span className="text-xs uppercase tracking-wide text-gray-500">{a.source}</span>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-lg leading-snug text-blue-700 hover:underline"
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
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
        {list.map((v) => (
          <button
            key={v}
            onClick={() => setSelected(toggle(selected, v))}
            className={`rounded-full border px-3 py-1 text-sm capitalize transition
              ${selected.includes(v) ? "bg-blue-600 text-white" : "bg-gray-50 hover:bg-gray-100"}`}
          >
            {v.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
