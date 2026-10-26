import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Wifi, Key, Coffee, Shield, ArrowRight, CheckCircle, Building2, Star, MapPin, Zap, Loader2, Heart } from "lucide-react";
import type { Route } from "./+types/home";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { SearchBar } from "../components/SearchBar";
import axiosInstance, { getCurrentUser } from "../axios";
import type { ApiSpace } from "../lib/api-types";
import { getSpaceImage, SPACE_TYPE_LABELS } from "../lib/api-types";
import { useFavorites } from "../lib/favorites";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Monet — Book Beautiful Coworking Spaces" },
    { name: "description", content: "Find and book curated coworking spaces, dedicated desks, and meeting rooms across Riga, Tallinn, Vilnius and top European cities." },
  ];
}

const CITIES = ["All", "Riga", "Jurmala", "Tallinn", "Vilnius"] as const;
type City = typeof CITIES[number];

// ─── Space Card ───────────────────────────────────────────────────────────────
function SpaceCard({ space, priceMode }: { space: ApiSpace; priceMode: "hour" | "day" }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(space.space_id);
  const img = getSpaceImage(space);
  const price = priceMode === "hour" ? space.price_per_hour : space.price_per_day;

  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/space/${space.space_id}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-zinc-200/70 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img src={img} alt={space.space_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        {space.is_instant_book && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 text-white shadow-sm">
            <Zap className="h-3 w-3" fill="currentColor" /> Instant
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!getCurrentUser()) {
                navigate("/login");
                return;
              }
              toggleFavorite(space.space_id);
            }}
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-sm"
            title={saved ? "Remove from saved" : "Save space"}
          >
            <Heart className={`h-4 w-4 transition-colors ${saved ? "fill-rose-500 text-rose-500" : "text-zinc-500"}`} strokeWidth={1.75} />
          </button>
          <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-zinc-800 shadow-sm">
            {SPACE_TYPE_LABELS[space.space_type] ?? space.space_type}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-[15px] text-zinc-900 leading-snug line-clamp-1">{space.space_name}</h3>
          {space.average_rating !== null && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" strokeWidth={0} />
              <span className="text-[13px] font-bold text-zinc-900 tabular-nums">{space.average_rating}</span>
              <span className="text-[12px] text-zinc-400">({space.review_count})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[12.5px] text-zinc-500 mb-4">
          <MapPin className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
          <span className="truncate">{space.city} · {space.address.split(",")[0]}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[20px] font-extrabold text-zinc-950 tabular-nums">€{price}</span>
            <span className="text-[12px] text-zinc-400 ml-1">/ {priceMode === "hour" ? "hr" : "day"}</span>
          </div>
          <div className="text-[12px] text-zinc-400">
            {space.available_spots} spots
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City>("All");
  const [priceMode, setPriceMode] = useState<"hour" | "day">("day");
  const [spaces, setSpaces] = useState<ApiSpace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: "9", offset: "0" };
    if (selectedCity !== "All") params.city = selectedCity;

    axiosInstance.get("/spaces", { params })
      .then(res => setSpaces(res.data.data ?? []))
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  return (
    <div className="min-h-screen text-zinc-900" style={{ background: "#f8f6f2" }}>
      <Navbar />

      {/* Hero */}
      <section className="hero-section relative overflow-hidden pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-175 h-105 rounded-full bg-amber-300/20 blur-[100px]" />
          <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-blue-400/10 blur-[80px]" />
          <div className="absolute top-10 -right-32 w-96 h-96 rounded-full bg-sky-300/12 blur-[90px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/80 backdrop-blur-sm px-4 py-1.5 text-[12px] font-semibold text-blue-700 shadow-sm mb-7">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {spaces.length > 0 ? `${spaces.length}+ verified spaces available today` : "Premium coworking spaces available"}
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[42px] sm:text-[56px] lg:text-[68px] font-extrabold tracking-tight text-zinc-950 leading-[1.08] mb-4">
            Find your space.<br />
            <span className="relative">
              <span className="relative z-10">Do your best work.</span>
              <span aria-hidden className="absolute bottom-1 left-0 right-0 h-3 bg-amber-300/40 rounded-full z-0" />
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="text-[16px] text-zinc-500 max-w-xl mx-auto leading-relaxed mb-10">
            Book premium coworking desks, private studios, and meeting rooms — no memberships, instant access.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}>
            <SearchBar />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.44 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-zinc-500">
            {["✓ Free cancellation on day passes", "✓ Verified 1 Gbps fiber", "✓ No sign-up required"].map(t => (
              <span key={t} className="font-medium">{t}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trending */}
      <section className="bg-section-cool py-14 border-t border-zinc-200/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Hand-picked</p>
              <h2 className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-zinc-950">Trending this week</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* City filter */}
              <div className="flex items-center rounded-xl bg-white border border-zinc-200/80 p-0.5 shadow-sm text-[12.5px] font-semibold">
                {CITIES.map(city => (
                  <button key={city} type="button" id={`city-${city.toLowerCase()}`}
                    onClick={() => setSelectedCity(city)}
                    className={`rounded-[10px] px-3 py-1.5 transition-all duration-200 ${selectedCity === city ? "bg-blue-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}>
                    {city}
                  </button>
                ))}
              </div>
              {/* Price mode */}
              <div className="flex items-center rounded-xl bg-white border border-zinc-200/80 p-0.5 shadow-sm text-[12px] font-semibold">
                {(["hour", "day"] as const).map(m => (
                  <button key={m} type="button" id={`price-${m}`} onClick={() => setPriceMode(m)}
                    className={`rounded-[10px] px-2.5 py-1.5 transition-all duration-200 ${priceMode === m ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-800"}`}>
                    {m === "hour" ? "/ hr" : "/ day"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <motion.div key={selectedCity} initial="hidden" animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces.length > 0
                ? spaces.map(space => <SpaceCard key={space.space_id} space={space} priceMode={priceMode} />)
                : <div className="col-span-3 py-20 text-center"><Building2 className="h-10 w-10 mx-auto mb-3 text-zinc-300" strokeWidth={1.25} /><p className="text-sm text-zinc-400 font-medium">No spaces found.</p></div>}
            </motion.div>
          )}

          <div className="mt-12 text-center">
            <Link to="/search"
              className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-300 px-8 py-3.5 text-[13.5px] font-bold text-zinc-900 shadow-sm transition-all hover:border-blue-400 hover:text-blue-700 hover:shadow-md active:scale-[0.98]">
              Explore all spaces
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* Bento */}
      <section className="bg-section-parchment py-20 border-t border-amber-100/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Why Monet</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 leading-tight">
              Built for focus.<br />Not noisy coffee shops.
            </h2>
            <p className="mt-3 text-[14px] text-zinc-500 leading-relaxed">Every space passes our strict 4-point quality inspection.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="md:row-span-2 relative overflow-hidden rounded-3xl bg-zinc-950 p-8 min-h-85 flex flex-col justify-between">
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_30%_0%,rgba(251,191,36,0.14),transparent_65%)]" />
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 border border-amber-400/20 mb-6">
                  <Wifi className="h-6 w-6 text-amber-400" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-[22px] font-bold text-white mb-3 leading-snug">Guaranteed<br />1 Gbps fiber</h3>
                <p className="text-[13.5px] text-zinc-400 leading-relaxed">Dual-redundant connections tested weekly. Zero jitter on Zoom, Figma, and deployments.</p>
              </div>
              <div className="relative z-10 flex flex-wrap gap-2 mt-6">
                {["Dual-redundant", "Weekly tested", "Zero jitter"].map(t => (
                  <span key={t} className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/60 rounded-full px-2.5 py-1 border border-zinc-700/50">{t}</span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl bg-amber-50 border border-amber-100/80 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 mb-4"><Key className="h-5 w-5 text-amber-700" strokeWidth={1.75} /></div>
              <h3 className="font-display text-[17px] font-bold text-zinc-950 mb-2">Instant digital key</h3>
              <p className="text-[13px] text-zinc-600 leading-relaxed">Book, get your code, walk in — 60 seconds flat.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl bg-emerald-50 border border-emerald-100/80 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 mb-4"><CheckCircle className="h-5 w-5 text-emerald-700" strokeWidth={1.75} /></div>
              <h3 className="font-display text-[17px] font-bold text-zinc-950 mb-2">No lock-in contracts</h3>
              <p className="text-[13px] text-zinc-600 leading-relaxed">Book a day pass. Cancel before check-in. No membership ever required.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl bg-rose-50 border border-rose-100/80 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 mb-4"><Coffee className="h-5 w-5 text-rose-700" strokeWidth={1.75} /></div>
              <h3 className="font-display text-[17px] font-bold text-zinc-950 mb-2">Specialty coffee</h3>
              <p className="text-[13px] text-zinc-600 leading-relaxed">Complimentary flat whites and artisan batch brew at every verified partner.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl bg-sky-50 border border-sky-100/80 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 mb-4"><Shield className="h-5 w-5 text-sky-700" strokeWidth={1.75} /></div>
              <h3 className="font-display text-[17px] font-bold text-zinc-950 mb-2">Verified ergonomics</h3>
              <p className="text-[13px] text-zinc-600 leading-relaxed">Herman Miller &amp; Steelcase seating with adjustable standing desks in every focus zone.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
