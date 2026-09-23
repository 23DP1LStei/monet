import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Star, Zap, Heart, MapPin } from "lucide-react";
import type { Route } from "./+types/search";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { COWORKING_SPACES, type CoworkingSpace } from "../data/coworkings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search Spaces — Monet" },
    { name: "description", content: "Find and book coworking spaces, dedicated desks and meeting rooms across Europe." },
  ];
}

type PriceMode = "hour" | "day" | "month";

interface Filters {
  cities: string[];
  maxPrice: number;
  minRating: number;
  instantOnly: boolean;
}

const DEFAULT_FILTERS: Filters = { cities: [], maxPrice: 200, minRating: 0, instantOnly: false };
const CITIES = ["Riga", "Tallinn", "Vilnius", "Berlin"];

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

function FilterSidebar({ filters, onChange, total }: {
  filters: Filters; onChange: (f: Filters) => void; total: number;
}) {
  const set = (p: Partial<Filters>) => onChange({ ...filters, ...p });
  const active = (filters.cities.length > 0 ? 1 : 0) + (filters.instantOnly ? 1 : 0) + (filters.maxPrice < 200 ? 1 : 0) + (filters.minRating > 0 ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
          <span className="font-display text-[14px] font-bold text-zinc-900">Filters</span>
          {active > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{active}</span>}
        </div>
        {active > 0 && (
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-[12px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      <div className="divide-y divide-zinc-100">
        <div className="px-5 py-4">
          <p className="text-[12px] font-bold uppercase tracking-wider text-zinc-500 mb-3">City</p>
          <div className="space-y-2">
            {CITIES.map(city => (
              <label key={city} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={filters.cities.includes(city)}
                  onChange={() => set({ cities: toggle(filters.cities, city) })}
                  className="h-4 w-4 rounded border-zinc-300 accent-blue-600 cursor-pointer" />
                <span className="text-[13px] text-zinc-700 group-hover:text-zinc-950 transition-colors font-medium">{city}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Max price / day: EUR{filters.maxPrice}</p>
          <input type="range" min={10} max={200} step={5} value={filters.maxPrice}
            onChange={e => set({ maxPrice: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full accent-blue-600 cursor-pointer" />
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">EUR10</span>
            <span className="text-[11px] text-zinc-400 font-medium">EUR200</span>
          </div>
        </div>

        <div className="px-5 py-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[13px] font-semibold text-zinc-900 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-600" fill="currentColor" /> Instant Book only
            </span>
            <button type="button" onClick={() => set({ instantOnly: !filters.instantOnly })}
              className={`relative inline-flex h-6 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${filters.instantOnly ? "bg-blue-600" : "bg-zinc-200"}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${filters.instantOnly ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </label>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-xl bg-blue-600 px-4 py-3 text-center text-[13px] font-bold text-white">
          {total} {total === 1 ? "space" : "spaces"} found
        </div>
      </div>
    </div>
  );
}

function SpaceCardRow({ space, priceMode }: { space: CoworkingSpace; priceMode: PriceMode }) {
  const [saved, setSaved] = useState(false);
  const price = priceMode === "hour" ? space.priceHour : priceMode === "month" ? space.priceMonth : space.priceDay;
  const label = priceMode === "hour" ? "hr" : priceMode === "month" ? "mo" : "day";

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group flex bg-white rounded-2xl overflow-hidden border border-zinc-200/70 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-all duration-300">
      <Link to={`/space/${space.id}`} className="relative w-[220px] flex-shrink-0 overflow-hidden">
        <img src={space.images[0]} alt={space.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        {space.badge && <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-zinc-900 shadow-sm">{space.badge}</div>}
      </Link>
      <div className="flex flex-1 flex-col justify-between p-5 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/space/${space.id}`}>
                <h2 className="text-[15px] font-bold text-zinc-950 hover:underline truncate">{space.name}</h2>
              </Link>
              <p className="text-[12.5px] text-zinc-500 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />{space.district}, {space.city}
              </p>
            </div>
            <button type="button" onClick={() => setSaved(!saved)} className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors">
              <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} strokeWidth={saved ? 0 : 1.75} />
            </button>
          </div>
          <p className="mt-2 text-[12.5px] text-zinc-500 line-clamp-2 leading-snug">{space.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-zinc-900" fill="currentColor" />
            <span className="text-[13px] font-semibold tabular-nums">{space.rating}</span>
            {space.isInstantBook && (
              <span className="ml-1 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                <Zap className="h-3 w-3" fill="currentColor" /> Instant
              </span>
            )}
          </div>
          <div>
            <span className="text-[17px] font-extrabold text-zinc-950 tabular-nums">EUR{price}</span>
            <span className="text-[12px] text-zinc-400"> / {label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [priceMode, setPriceMode] = useState<PriceMode>("day");
  const locationParam = searchParams.get("location") ?? "";

  const results = useMemo(() => {
    let list = [...COWORKING_SPACES];
    if (locationParam)         list = list.filter(s => s.city.toLowerCase() === locationParam.toLowerCase());
    if (filters.cities.length) list = list.filter(s => filters.cities.includes(s.city));
    if (filters.instantOnly)   list = list.filter(s => s.isInstantBook);
    if (filters.minRating > 0) list = list.filter(s => s.rating >= filters.minRating);
    list = list.filter(s => s.priceDay <= filters.maxPrice);
    return list;
  }, [filters, locationParam]);

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[13px] text-zinc-500">
            <MapPin className="h-4 w-4 text-blue-600" strokeWidth={1.75} />
            <span className="font-semibold text-zinc-800">{locationParam || "All cities"}</span>
            <span>·</span>
            <span>{results.length} spaces</span>
          </div>
          <div className="flex items-center rounded-xl bg-zinc-100 p-0.5 text-[12px] font-semibold">
            {(["hour", "day", "month"] as PriceMode[]).map(m => (
              <button key={m} type="button" onClick={() => setPriceMode(m)}
                className={`rounded-[10px] px-2.5 py-1.5 transition-all ${priceMode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}>
                / {m === "hour" ? "hr" : m === "day" ? "day" : "mo"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="popLayout">
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map(space => <SpaceCardRow key={space.id} space={space} priceMode={priceMode} />)}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <p className="text-zinc-400 font-medium">No spaces found</p>
                  <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="mt-4 rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700">
                    Clear filters
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
          <div className="hidden lg:block w-[280px] flex-shrink-0 sticky top-[88px]">
            <FilterSidebar filters={filters} onChange={setFilters} total={results.length} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}