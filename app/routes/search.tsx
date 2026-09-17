import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, X, Star, Zap, Wifi, Car,
  Coffee, Printer, Clock, ChevronDown, ArrowUpDown,
  Heart, ChevronLeft, ChevronRight, Building2, MapPin,
} from "lucide-react";
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

/* ─── Types ───────────────────────────────────────────── */
type SortKey = "recommended" | "price_asc" | "price_desc" | "rating";
type PriceMode = "hour" | "day" | "month";
type SpaceType = "hot-desk" | "dedicated" | "private-office" | "meeting-room";

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  "hot-desk": "Hot Desk",
  "dedicated": "Dedicated Desk",
  "private-office": "Private Office",
  "meeting-room": "Meeting Room",
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "1 Gbps Wi-Fi":    <Wifi     className="h-3.5 w-3.5" />,
  "Parking":         <Car      className="h-3.5 w-3.5" />,
  "Free coffee":     <Coffee   className="h-3.5 w-3.5" />,
  "Printer":         <Printer  className="h-3.5 w-3.5" />,
  "24h access":      <Clock    className="h-3.5 w-3.5" />,
};

const ALL_AMENITIES = Object.keys(AMENITY_ICONS);
const CITIES = ["Riga", "Tallinn", "Vilnius", "Berlin"];
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended",  label: "Recommended" },
  { key: "price_asc",    label: "Price: low → high" },
  { key: "price_desc",   label: "Price: high → low" },
  { key: "rating",       label: "Top rated" },
];

/* ─── Horizontal SpaceCard ────────────────────────────── */
function SpaceCardRow({ space, priceMode }: { space: CoworkingSpace; priceMode: PriceMode }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved,  setSaved]  = useState(false);
  const [hovered, setHovered] = useState(false);

  const price = priceMode === "hour" ? space.priceHour : priceMode === "month" ? space.priceMonth : space.priceDay;
  const label = priceMode === "hour" ? "hr" : priceMode === "month" ? "mo" : "day";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group flex gap-0 bg-white rounded-2xl overflow-hidden border border-zinc-200/70 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Link to={`/space/${space.id}`} className="relative w-[220px] flex-shrink-0 overflow-hidden">
        <img
          src={space.images[imgIdx]}
          alt={space.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 pointer-events-none" />

        {space.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-zinc-900 shadow-sm">
            {space.badge}
          </div>
        )}

        {space.isInstantBook && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-blue-600 rounded-lg px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Zap className="h-3 w-3" fill="currentColor" />
            Instant
          </div>
        )}

        {hovered && space.images.length > 1 && (
          <>
            <button onClick={(e) => { e.preventDefault(); setImgIdx(i => (i - 1 + space.images.length) % space.images.length); }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
              <ChevronLeft className="h-3.5 w-3.5 text-zinc-800" strokeWidth={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); setImgIdx(i => (i + 1) % space.images.length); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
              <ChevronRight className="h-3.5 w-3.5 text-zinc-800" strokeWidth={2} />
            </button>
          </>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1 text-[12px] font-medium text-zinc-500">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {space.district}, {space.city}
              </span>
            </div>
            <Link to={`/space/${space.id}`}>
              <h3 className="font-display text-[15px] font-bold text-zinc-950 hover:text-blue-700 transition-colors leading-snug truncate">
                {space.name}
              </h3>
            </Link>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["1 Gbps Wi-Fi", "Free coffee", "24h access"].map(a => (
                <span key={a} className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-full px-2 py-0.5">
                  {AMENITY_ICONS[a]}{a}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button type="button" onClick={() => setSaved(s => !s)}
              className="p-1.5 rounded-full hover:bg-zinc-100 transition-colors">
              <Heart className={`h-4.5 w-4.5 transition-colors ${saved ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} strokeWidth={saved ? 0 : 2} />
            </button>
            <div className="flex items-center gap-1 bg-zinc-950 text-white rounded-lg px-2 py-1">
              <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
              <span className="text-[12px] font-bold tabular-nums">{space.rating}</span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-[22px] font-extrabold text-zinc-950 tabular-nums leading-none">€{price}</span>
            <span className="text-[13px] text-zinc-400 ml-1">/ {label}</span>
          </div>
          <Link to={`/space/${space.id}`}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm shadow-blue-600/20">
            Book now
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Filter Sidebar ──────────────────────────────────── */
interface Filters {
  cities: string[];
  types: SpaceType[];
  maxPrice: number;
  minRating: number;
  amenities: string[];
  instantOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  cities: [],
  types: [],
  maxPrice: 200,
  minRating: 0,
  amenities: [],
  instantOnly: false,
};

function FilterSidebar({
  filters, onChange, total,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const activeCount = [
    filters.cities.length > 0,
    filters.types.length > 0,
    filters.maxPrice < 200,
    filters.minRating > 0,
    filters.amenities.length > 0,
    filters.instantOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-600" strokeWidth={1.75} />
          <span className="font-display text-[14px] font-bold text-zinc-900">Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button type="button" onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-[12px] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      <div className="divide-y divide-zinc-100">
        {/* City */}
        <FilterSection title="City">
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
        </FilterSection>

        {/* Space type */}
        <FilterSection title="Space type">
          <div className="space-y-2">
            {(Object.entries(SPACE_TYPE_LABELS) as [SpaceType, string][]).map(([id, label]) => (
              <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={filters.types.includes(id)}
                  onChange={() => set({ types: toggle(filters.types, id) })}
                  className="h-4 w-4 rounded border-zinc-300 accent-blue-600 cursor-pointer" />
                <span className="text-[13px] text-zinc-700 group-hover:text-zinc-950 transition-colors font-medium">{label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price / day */}
        <FilterSection title={`Max price / day: €${filters.maxPrice}`}>
          <input type="range" min={10} max={200} step={5}
            value={filters.maxPrice}
            onChange={e => set({ maxPrice: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full accent-blue-600 cursor-pointer" />
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">€10</span>
            <span className="text-[11px] text-zinc-400 font-medium">€200</span>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Minimum rating">
          <div className="flex gap-1.5">
            {[0, 4, 4.5, 4.8].map(r => (
              <button key={r} type="button"
                onClick={() => set({ minRating: r })}
                className={`flex-1 rounded-xl py-2 text-[12px] font-semibold border transition-all ${filters.minRating === r ? "bg-blue-600 text-white border-blue-600" : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"}`}>
                {r === 0 ? "Any" : `${r}+`}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Amenities */}
        <FilterSection title="Amenities">
          <div className="space-y-2">
            {ALL_AMENITIES.map(a => (
              <label key={a} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={filters.amenities.includes(a)}
                  onChange={() => set({ amenities: toggle(filters.amenities, a) })}
                  className="h-4 w-4 rounded border-zinc-300 accent-blue-600 cursor-pointer" />
                <span className="flex items-center gap-1.5 text-[13px] text-zinc-700 group-hover:text-zinc-950 font-medium transition-colors">
                  <span className="text-zinc-400">{AMENITY_ICONS[a]}</span>
                  {a}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Instant book */}
        <div className="px-5 py-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-[13px] font-semibold text-zinc-900 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-600" fill="currentColor" />
                Instant Book only
              </span>
              <span className="text-[11px] text-zinc-400 mt-0.5 block">No approval needed</span>
            </div>
            <button type="button" onClick={() => set({ instantOnly: !filters.instantOnly })}
              className={`relative inline-flex h-6 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${filters.instantOnly ? "bg-blue-600" : "bg-zinc-200"}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${filters.instantOnly ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </label>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <div className="rounded-xl bg-blue-600 px-4 py-3 text-center text-[13px] font-bold text-white shadow-sm shadow-blue-600/20">
          {total} {total === 1 ? "space" : "spaces"} found
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="px-5 py-4">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between mb-3 group">
        <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-700 transition-colors">{title}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [priceMode, setPriceMode] = useState<PriceMode>("day");
  const [sortOpen, setSortOpen] = useState(false);

  const locationParam = searchParams.get("location") ?? "";

  const results = useMemo(() => {
    let list = [...COWORKING_SPACES];

    if (locationParam) list = list.filter(s => s.city.toLowerCase() === locationParam.toLowerCase());
    if (filters.cities.length)    list = list.filter(s => filters.cities.includes(s.city));
    if (filters.instantOnly)      list = list.filter(s => s.isInstantBook);
    if (filters.minRating > 0)    list = list.filter(s => s.rating >= filters.minRating);
    list = list.filter(s => s.priceDay <= filters.maxPrice);

    switch (sort) {
      case "price_asc":  list.sort((a, b) => a.priceDay - b.priceDay); break;
      case "price_desc": list.sort((a, b) => b.priceDay - a.priceDay); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
    }

    return list;
  }, [filters, sort, locationParam]);

  const currentSort = SORT_OPTIONS.find(o => o.key === sort)!;

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />

      {/* Top bar */}
      <div className="border-b border-zinc-200/60 bg-white/90 backdrop-blur-sm sticky top-[68px] z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[13px] text-zinc-500 min-w-0">
            <MapPin className="h-4 w-4 flex-shrink-0 text-blue-600" strokeWidth={1.75} />
            <span className="font-semibold text-zinc-800 truncate">
              {locationParam || "All cities"}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline font-medium">{results.length} spaces</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Price mode toggle */}
            <div className="hidden sm:flex items-center rounded-xl bg-zinc-100 p-0.5 text-[12px] font-semibold">
              {(["hour", "day", "month"] as PriceMode[]).map(m => (
                <button key={m} type="button" onClick={() => setPriceMode(m)}
                  className={`rounded-[10px] px-2.5 py-1.5 transition-all duration-200 ${priceMode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
                  / {m === "hour" ? "hr" : m === "day" ? "day" : "mo"}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <button type="button" onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-zinc-700 hover:border-zinc-300 transition-colors shadow-sm">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
                {currentSort.label}
                <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 bg-white rounded-xl border border-zinc-200/80 shadow-lg overflow-hidden">
                      {SORT_OPTIONS.map(o => (
                        <button key={o.key} type="button"
                          onClick={() => { setSort(o.key); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${sort === o.key ? "bg-blue-50 text-blue-700 font-semibold" : "text-zinc-700 hover:bg-zinc-50 font-medium"}`}>
                          {o.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6 items-start">

          {/* ── Results list (left) ── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="popLayout">
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((space) => (
                    <SpaceCardRow key={space.id} space={space} priceMode={priceMode} />
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-28 text-center">
                  <Building2 className="h-12 w-12 text-zinc-200 mb-4" strokeWidth={1.25} />
                  <h3 className="font-display text-lg font-bold text-zinc-400 mb-2">No spaces found</h3>
                  <p className="text-sm text-zinc-400 max-w-xs">Try adjusting your filters or searching a different city.</p>
                  <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="mt-5 rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-400 transition-colors">
                    Clear all filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Filter sidebar (right, sticky) ── */}
          <div className="hidden lg:block w-[300px] flex-shrink-0 sticky top-[120px]">
            <FilterSidebar filters={filters} onChange={setFilters} total={results.length} />
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
