import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Star, MapPin, Zap, ArrowRight, Loader2, Building2
} from "lucide-react";
import type { Route } from "./+types/saved";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import axiosInstance, { getCurrentUser } from "../axios";
import type { ApiSpace } from "../lib/api-types";
import { getSpaceImage, SPACE_TYPE_LABELS } from "../lib/api-types";
import { useFavorites } from "../lib/favorites";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Saved Spaces — Monet" },
    { name: "description", content: "Your favorited and bookmarked coworking spaces." },
  ];
}

export default function SavedSpaces() {
  const navigate = useNavigate();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [allSpaces, setAllSpaces] = useState<ApiSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceMode, setPriceMode] = useState<"hour" | "day">("day");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    axiosInstance
      .get("/spaces", { params: { limit: 100 } })
      .then((res) => {
        setAllSpaces(res.data.data ?? []);
      })
      .catch((err) => {
        console.error("Failed to load spaces:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const savedSpaces = allSpaces.filter((s) => isFavorite(s.space_id));

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-zinc-900 flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-zinc-200/60">
            <div>
              <h6 className="text-[11px] font-bold text-[#A1A1AA] mb-1.5 tracking-[1.2px] uppercase">
                MEMBER PORTAL
              </h6>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
                  Saved Spaces
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  {savedSpaces.length}
                </span>
              </div>
              <p className="text-sm text-[#71717A] mt-1">
                Your bookmarked coworking locations, private studios, and meeting rooms.
              </p>
            </div>

            {/* Price mode toggle */}
            <div className="flex items-center rounded-xl bg-white border border-zinc-200/80 p-0.5 shadow-sm text-[12px] font-semibold self-start sm:self-end">
              {(["hour", "day"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPriceMode(m)}
                  className={`rounded-[10px] px-3 py-1.5 transition-all ${
                    priceMode === m
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {m === "hour" ? "Hourly" : "Day Pass"}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="text-xs font-medium text-zinc-400">Loading your saved spaces...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && savedSpaces.length === 0 && (
            <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-md mx-auto shadow-sm my-12">
              <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500">
                <Heart className="h-8 w-8" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-1">
                No saved spaces yet
              </h3>
              <p className="text-xs text-zinc-500 mb-6 max-w-xs mx-auto leading-relaxed">
                Click the heart icon on any coworking space in search or on the home page to save it for quick access.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm shadow-blue-600/25"
              >
                Explore Spaces <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Saved spaces grid */}
          {!loading && savedSpaces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {savedSpaces.map((space) => {
                  const img = getSpaceImage(space);
                  const price =
                    priceMode === "hour"
                      ? space.price_per_hour
                      : space.price_per_day;

                  return (
                    <motion.div
                      layout
                      key={space.space_id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                      className="group bg-white rounded-2xl overflow-hidden border border-zinc-200/70 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Image header */}
                      <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => navigate(`/space/${space.space_id}`)}>
                        <img
                          src={img}
                          alt={space.space_name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                        {space.is_instant_book && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-sm">
                            <Zap className="h-3 w-3" fill="currentColor" /> Instant
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(space.space_id);
                          }}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-sm"
                          title="Remove from saved"
                        >
                          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" strokeWidth={1.5} />
                        </button>

                        <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-white/90 backdrop-blur-md text-zinc-800 shadow-sm">
                          {SPACE_TYPE_LABELS[space.space_type] ?? space.space_type}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <Link
                              to={`/space/${space.space_id}`}
                              className="font-bold text-[15px] text-zinc-950 hover:text-blue-600 transition leading-snug line-clamp-1"
                            >
                              {space.space_name}
                            </Link>
                            {space.average_rating !== null && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" strokeWidth={0} />
                                <span className="text-[13px] font-bold text-zinc-900 tabular-nums">
                                  {space.average_rating}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[12.5px] text-zinc-500 mb-4">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">
                              {space.city} · {space.address.split(",")[0]}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                          <div>
                            <span className="text-[20px] font-extrabold text-zinc-950 tabular-nums">
                              €{price}
                            </span>
                            <span className="text-[12px] text-zinc-400 ml-1">
                              / {priceMode === "hour" ? "hr" : "day"}
                            </span>
                          </div>

                          <Link
                            to={`/space/${space.space_id}`}
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 transition shadow-sm shadow-blue-600/25 active:scale-95"
                          >
                            View & Book
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
