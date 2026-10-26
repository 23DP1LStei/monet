import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, X, Star, Zap, MapPin,
  ChevronDown, ArrowUpDown, Heart, Building2, Loader2,
} from "lucide-react";
import type { Route } from "./+types/search";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import axiosInstance, { getCurrentUser } from "../axios";
import type { ApiSpace } from "../lib/api-types";
import { getSpaceImage, SPACE_TYPE_LABELS, AMENITIES_CATALOG } from "../lib/api-types";
import { useFavorites } from "../lib/favorites";
import { AmenityIcon, AmenityBadge } from "../components/AmenityItem";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search Spaces — Monet" },
    { name: "description", content: "Find and book coworking spaces, dedicated desks and meeting rooms across Europe." },
  ];
}

type SortKey = "recommended" | "price_asc" | "price_desc" | "rating";
type PriceMode = "hour" | "day";
type SpaceType = "hot-desk" | "dedicated" | "private-office" | "meeting-room";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc",   label: "Price: low → high" },
  { key: "price_desc",  label: "Price: high → low" },
  { key: "rating",      label: "Top rated" },
];

// ─── Horizontal Space Card ────────────────────────────────────────────────────
function SpaceCardRow({ space, priceMode }: { space: ApiSpace; priceMode: PriceMode }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(space.space_id);
  const img = getSpaceImage(space);
  const price = priceMode === "hour" ? space.price_per_hour : space.price_per_day;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group flex gap-0 bg-white rounded-2xl overflow-hidden border border-zinc-200/70 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-all duration-300"
    >
      {/* Image */}
      <div
        className="relative w-[220px] flex-shrink-0 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/space/${space.space_id}`)}
      >
        <img
          src={img} alt={space.space_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 pointer-events-none" />
        {space.is_instant_book && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-sm flex items-center gap-1">
            <Zap className="h-3 w-3" fill="currentColor" /> Instant
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <Link to={`/space/${space.space_id}`} className="font-bold text-[16px] text-zinc-900 hover:text-blue-600 transition-colors line-clamp-1">
              {space.space_name}
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!getCurrentUser()) {
                  navigate("/login");
                  return;
                }
                toggleFavorite(space.space_id);
              }}
              className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors"
              title={saved ? "Remove from saved" : "Save space"}
            >
              <Heart className={`h-4 w-4 transition-colors ${saved ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 mb-3">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
            <span className="truncate">{space.city} · {space.address}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 text-zinc-700">
              {SPACE_TYPE_LABELS[space.space_type]}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 text-zinc-600">
              {space.available_spots} spots
            </span>
            {space.amenities && space.amenities.slice(0, 3).map((aId) => (
              <AmenityBadge key={aId} id={aId} />
            ))}
            {space.amenities && space.amenities.length > 3 && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-zinc-50 text-zinc-400 border border-zinc-200/60">
                +{space.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-extrabold text-zinc-950 tabular-nums">€{price}</span>
            <span className="text-[12px] text-zinc-400">/ {priceMode === "hour" ? "hr" : "day"}</span>
          </div>
          <div className="flex items-center gap-3">
            {space.average_rating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" strokeWidth={0} />
                <span className="text-[13px] font-bold tabular-nums">{space.average_rating}</span>
                <span className="text-[12px] text-zinc-400">({space.review_count})</span>
              </div>
            )}
            <Link to={`/space/${space.space_id}`}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm shadow-blue-600/20">
              Book
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Search Page ──────────────────────────────────────────────────────────────
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [spaces, setSpaces]       = useState<ApiSpace[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sortKey, setSortKey]     = useState<SortKey>("recommended");
  const [priceMode, setPriceMode] = useState<PriceMode>("day");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort]   = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const { isFavorite, count: favoritesCount } = useFavorites();

  // Filter state (synced with URL params)
  const [cityFilter, setCityFilter]       = useState(searchParams.get("location") ?? searchParams.get("city") ?? "");
  const [typeFilter, setTypeFilter]       = useState<SpaceType | "">(searchParams.get("type") as SpaceType ?? "");
  const [instantOnly, setInstantOnly]     = useState(searchParams.get("instant") === "true");
  const [priceMax, setPriceMax]           = useState(searchParams.get("price_max") ?? "");
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>(() => {
    const raw = searchParams.get("amenities");
    return raw ? raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : [];
  });

  const fetchSpaces = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: "50", offset: "0", period: priceMode };
    if (cityFilter) params.city = cityFilter;
    if (typeFilter) params.type = typeFilter;
    if (instantOnly) params.instant_book = "true";
    if (priceMax) params.price_max = priceMax;
    if (amenitiesFilter.length > 0) params.amenities = amenitiesFilter.join(",");

    axiosInstance.get("/spaces", { params })
      .then(res => setSpaces(res.data.data ?? []))
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, [cityFilter, typeFilter, instantOnly, priceMax, amenitiesFilter, priceMode]);

  useEffect(() => { fetchSpaces(); }, [fetchSpaces]);

  const sorted = [...spaces].sort((a, b) => {
    if (sortKey === "price_asc")  return a.price_per_day - b.price_per_day;
    if (sortKey === "price_desc") return b.price_per_day - a.price_per_day;
    if (sortKey === "rating") {
      return (b.average_rating ?? 0) - (a.average_rating ?? 0);
    }
    return 0;
  });

  const displayed = sorted.filter(s => !savedOnly || isFavorite(s.space_id));

  const toggleAmenity = (id: string) => {
    const next = amenitiesFilter.includes(id)
      ? amenitiesFilter.filter((a) => a !== id)
      : [...amenitiesFilter, id];
    setAmenitiesFilter(next);
    const p: Record<string, string> = {};
    if (cityFilter) p.city = cityFilter;
    if (typeFilter) p.type = typeFilter;
    if (instantOnly) p.instant = "true";
    if (priceMax) p.price_max = priceMax;
    if (next.length > 0) p.amenities = next.join(",");
    setSearchParams(p);
  };

  const applyFilters = () => {
    const p: Record<string, string> = {};
    if (cityFilter) p.city = cityFilter;
    if (typeFilter) p.type = typeFilter;
    if (instantOnly) p.instant = "true";
    if (priceMax) p.price_max = priceMax;
    if (amenitiesFilter.length > 0) p.amenities = amenitiesFilter.join(",");
    setSearchParams(p);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setCityFilter(""); setTypeFilter(""); setInstantOnly(false); setPriceMax(""); setSavedOnly(false); setAmenitiesFilter([]);
    setSearchParams({});
  };

  const activeFilters = [
    cityFilter,
    typeFilter,
    instantOnly ? "instant" : "",
    priceMax,
    savedOnly ? "saved" : "",
    amenitiesFilter.length > 0 ? "amenities" : "",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 pb-24">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              {loading ? "Searching..." : `${displayed.length} spaces found`}
            </p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-zinc-950">
              {savedOnly ? "Saved Spaces" : cityFilter ? `Spaces in ${cityFilter}` : "All coworking spaces"}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Saved filter toggle */}
            <button
              type="button"
              onClick={() => setSavedOnly(s => !s)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all ${
                savedOnly
                  ? "bg-rose-50 border-rose-300 text-rose-700 shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${savedOnly ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} />
              <span>Saved{favoritesCount > 0 ? ` (${favoritesCount})` : ""}</span>
            </button>

            {/* Sort */}
            <div className="relative">
              <button type="button" id="sort-btn" onClick={() => setShowSort(s => !s)}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-zinc-700 hover:border-zinc-300 shadow-sm transition-all">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
                {SORT_OPTIONS.find(o => o.key === sortKey)?.label}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                  <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 bg-white border border-zinc-200/80 rounded-2xl shadow-xl overflow-hidden p-1.5">
                    {SORT_OPTIONS.map(o => (
                      <button key={o.key} type="button" onClick={() => { setSortKey(o.key); setShowSort(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${sortKey === o.key ? "bg-blue-600 text-white" : "text-zinc-700 hover:bg-zinc-50"}`}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Price mode */}
            <div className="flex items-center rounded-xl bg-white border border-zinc-200/80 p-0.5 shadow-sm text-[12px] font-semibold">
              {(["hour", "day"] as const).map(m => (
                <button key={m} type="button" onClick={() => setPriceMode(m)}
                  className={`rounded-[10px] px-3 py-1.5 transition-all ${priceMode === m ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-800"}`}>
                  / {m === "hour" ? "hr" : "day"}
                </button>
              ))}
            </div>

            {/* Filters */}
            <button type="button" id="filters-btn" onClick={() => setShowFilters(true)}
              className={`relative flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-semibold shadow-sm transition-all ${activeFilters > 0 ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"}`}>
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
              Filters
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Amenity Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-0.5">
            Included:
          </span>
          {AMENITIES_CATALOG.slice(0, 9).map((amenity) => {
            const active = amenitiesFilter.includes(amenity.id);
            return (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleAmenity(amenity.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border shrink-0 transition-all ${
                  active
                    ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-sm"
                    : "bg-white border-zinc-200/90 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                }`}
              >
                <AmenityIcon
                  name={amenity.iconName}
                  className={`h-3.5 w-3.5 ${active ? "text-white" : "text-zinc-500"}`}
                />
                <span>{amenity.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Space list */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-9 w-9 animate-spin text-zinc-400" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-4">
              {displayed.length > 0
                ? displayed.map(space => <SpaceCardRow key={space.space_id} space={space} priceMode={priceMode} />)
                : (
                  <div className="py-24 text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-zinc-300" strokeWidth={1.25} />
                    <p className="text-sm font-semibold text-zinc-400 mb-2">No spaces match your filters.</p>
                    <button type="button" onClick={clearFilters}
                      className="mt-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors">
                      Clear filters
                    </button>
                  </div>
                )}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowFilters(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <h2 className="text-[16px] font-bold text-zinc-900">Filters</h2>
                <button type="button" onClick={() => setShowFilters(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
                  <X className="h-4 w-4 text-zinc-600" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* City */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">City</label>
                  <input type="text" value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                    placeholder="e.g. Riga"
                    className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none" />
                </div>

                {/* Space type */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Space Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(SPACE_TYPE_LABELS) as [SpaceType, string][]).map(([id, label]) => (
                      <button key={id} type="button"
                        onClick={() => setTypeFilter(typeFilter === id ? "" : id)}
                        className={`px-3 py-2.5 rounded-xl border text-[12.5px] font-semibold text-left transition-all ${typeFilter === id ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max price */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Max price per day {priceMax ? `(€${priceMax})` : ""}
                  </label>
                  <input type="range" min="10" max="300" step="5"
                    value={priceMax || "300"}
                    onChange={e => setPriceMax(e.target.value === "300" ? "" : e.target.value)}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                    <span>€10</span><span>€300+</span>
                  </div>
                </div>

                {/* Instant book */}
                <div className="flex items-center justify-between py-3 border-t border-zinc-100">
                  <div>
                    <p className="text-[13.5px] font-semibold text-zinc-900">Instant Book only</p>
                    <p className="text-[12px] text-zinc-400">No approval needed</p>
                  </div>
                  <button type="button" id="instant-toggle" onClick={() => setInstantOnly(v => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${instantOnly ? "bg-blue-600" : "bg-zinc-200"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${instantOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* What's included (Amenities) */}
                <div className="border-t border-zinc-100 pt-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      What's Included {amenitiesFilter.length > 0 ? `(${amenitiesFilter.length})` : ""}
                    </label>
                    {amenitiesFilter.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmenitiesFilter([])}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {AMENITIES_CATALOG.map((amenity) => {
                      const active = amenitiesFilter.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => {
                            setAmenitiesFilter((prev) =>
                              prev.includes(amenity.id)
                                ? prev.filter((a) => a !== amenity.id)
                                : [...prev, amenity.id]
                            );
                          }}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left text-[11.5px] transition-all ${
                            active
                              ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-sm"
                              : "bg-zinc-50 border-zinc-200/80 text-zinc-700 hover:border-zinc-300 hover:bg-white font-medium"
                          }`}
                        >
                          <AmenityIcon
                            name={amenity.iconName}
                            className={`h-3.5 w-3.5 shrink-0 ${active ? "text-white" : "text-zinc-500"}`}
                          />
                          <span className="truncate">{amenity.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-zinc-100 flex gap-3">
                <button type="button" onClick={clearFilters}
                  className="flex-1 rounded-xl border border-zinc-200 py-3 text-[13px] font-bold text-zinc-700 hover:bg-zinc-50 transition-all">
                  Clear all
                </button>
                <button type="button" id="apply-filters-btn" onClick={applyFilters}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-[13px] font-bold text-white hover:bg-blue-700 transition-all">
                  Apply filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}