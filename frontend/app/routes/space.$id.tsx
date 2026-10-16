import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MapPin, Wifi, Key, Coffee, Shield, ChevronLeft,
  ChevronRight, Heart, Zap, Share2, Grid2X2, X,
  CheckCircle, Clock, Users, Calendar, Loader2, Building2,
} from "lucide-react";
import type { Route } from "./+types/space.$id";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import axiosInstance from "../axios";
import { getCurrentUser } from "../axios";
import type { ApiSpace, ApiReview } from "../lib/api-types";
import { getSpaceImages, SPACE_TYPE_LABELS } from "../lib/api-types";
import { useFavorites } from "../lib/favorites";
import { AmenityCard } from "../components/AmenityItem";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Space — Monet` },
    { name: "description", content: "Book a premium coworking space on Monet." },
  ];
}

// ─── Gallery Modal ────────────────────────────────────────────────────────────
function GalleryModal({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
        <X className="h-5 w-5 text-white" strokeWidth={1.75} />
      </button>
      <div className="flex items-center gap-4 px-4 w-full max-w-5xl" onClick={e => e.stopPropagation()}>
        <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
          <ChevronLeft className="h-6 w-6 text-white" strokeWidth={1.75} />
        </button>
        <div className="flex-1 aspect-[16/10] rounded-2xl overflow-hidden">
          <img src={images[idx]} alt="" className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"; }}
          />
        </div>
        <button onClick={() => setIdx(i => (i + 1) % images.length)}
          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
          <ChevronRight className="h-6 w-6 text-white" strokeWidth={1.75} />
        </button>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/60 font-medium tabular-nums">{idx + 1} / {images.length}</div>
    </motion.div>
  );
}

// ─── Booking Widget ───────────────────────────────────────────────────────────
type PriceMode = "hour" | "day";

function BookingWidget({ space }: { space: ApiSpace }) {
  const navigate = useNavigate();
  const [priceMode, setPriceMode] = useState<PriceMode>("day");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [guests, setGuests] = useState(1);

  const price = priceMode === "hour" ? space.price_per_hour : space.price_per_day;
  const serviceFee = Math.round(price * guests * 0.08);
  const total = price * guests + serviceFee;

  const handleBook = () => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!startDate) {
      alert("Please select a date.");
      return;
    }
    const params = new URLSearchParams({
      date: startDate,
      desks: String(guests),
      mode: priceMode,
      start: `${startDate}T${startTime}:00`,
      end: `${startDate}T${endTime}:00`,
    });
    navigate(`/book/${space.space_id}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-6">
      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="text-[26px] font-extrabold text-zinc-950 tabular-nums">€{price}</span>
        <span className="text-[13px] text-zinc-400">/ {priceMode === "hour" ? "hr" : "day"}</span>
      </div>

      {/* Price mode tabs */}
      <div className="flex items-center rounded-xl bg-zinc-100 p-0.5 mb-5 text-[12px] font-semibold">
        {(["hour", "day"] as PriceMode[]).map(m => (
          <button key={m} type="button" onClick={() => setPriceMode(m)}
            className={`flex-1 rounded-[10px] py-2 transition-all ${priceMode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}>
            {m === "hour" ? "Hourly" : "Day pass"}
          </button>
        ))}
      </div>

      {/* Date */}
      <div className="mb-3">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Date</label>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-3 text-[13.5px] font-medium text-zinc-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
        </div>
      </div>

      {/* Times (hourly mode) */}
      {priceMode === "hour" && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">From</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-[13.5px] font-medium text-zinc-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">To</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-[13.5px] font-medium text-zinc-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
        </div>
      )}

      {/* Guests */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Desks</label>
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <span className="text-[13.5px] font-medium text-zinc-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" strokeWidth={1.75} /> {guests} {guests === 1 ? "desk" : "desks"}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setGuests(g => Math.max(1, g - 1))}
              className="h-7 w-7 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 transition-colors">-</button>
            <span className="w-6 text-center text-[13px] font-bold tabular-nums">{guests}</span>
            <button type="button" onClick={() => setGuests(g => Math.min(space.available_spots, g + 1))}
              className="h-7 w-7 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 transition-colors">+</button>
          </div>
        </div>
      </div>

      <button type="button" id="book-btn" onClick={handleBook}
        className="w-full rounded-xl bg-blue-600 py-4 text-[14px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 mb-4">
        {space.is_instant_book
          ? <><Zap className="h-4 w-4" fill="currentColor" /> Book instantly</>
          : <><Clock className="h-4 w-4" strokeWidth={1.75} /> Reserve</>}
      </button>

      <div className="space-y-2 text-[13px] border-t border-zinc-100 pt-4">
        <div className="flex justify-between text-zinc-600"><span>€{price} × {guests} desk{guests > 1 ? "s" : ""}</span><span className="tabular-nums">€{price * guests}</span></div>
        <div className="flex justify-between text-zinc-600"><span>Service fee</span><span className="tabular-nums">€{serviceFee}</span></div>
        <div className="flex justify-between font-bold text-zinc-900 pt-2 border-t border-zinc-100 text-[14px]"><span>Total</span><span className="tabular-nums">€{total}</span></div>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-400">Free cancellation before check-in</p>
    </div>
  );
}

// ─── Space Detail Page ────────────────────────────────────────────────────────
export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState<ApiSpace | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = space ? isFavorite(space.space_id) : false;
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      axiosInstance.get(`/spaces/${id}`),
      axiosInstance.get(`/spaces/${id}/reviews`, { params: { limit: 6 } }),
    ])
      .then(([spaceRes, reviewsRes]) => {
        setSpace(spaceRes.data.data);
        setReviews(reviewsRes.data.data ?? []);
      })
      .catch(() => setSpace(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f6f2" }}>
        <Navbar />
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#f8f6f2" }}>
        <Navbar />
        <Building2 className="h-12 w-12 text-zinc-300" strokeWidth={1.25} />
        <p className="text-zinc-500 text-lg font-medium">Space not found.</p>
        <Link to="/search" className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors">Browse spaces</Link>
      </div>
    );
  }

  const images = getSpaceImages(space);

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />
      <AnimatePresence>
        {galleryOpen && <GalleryModal images={images} startIndex={galleryStart} onClose={() => setGalleryOpen(false)} />}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12.5px] text-zinc-400 font-medium mb-5">
          <Link to="/" className="hover:text-zinc-700 transition-colors">Home</Link><span>/</span>
          <Link to="/search" className="hover:text-zinc-700 transition-colors">Spaces</Link><span>/</span>
          <Link to={`/search?city=${space.city}`} className="hover:text-zinc-700 transition-colors">{space.city}</Link><span>/</span>
          <span className="text-zinc-600 truncate">{space.space_name}</span>
        </nav>

        {/* Title + actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-900 text-white">
                {SPACE_TYPE_LABELS[space.space_type]}
              </span>
              {space.is_instant_book && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700">
                  <Zap className="h-3 w-3" strokeWidth={2} /> Instant Book
                </span>
              )}
            </div>
            <h1 className="font-display text-[28px] sm:text-[34px] font-extrabold text-zinc-950 tracking-tight leading-tight">
              {space.space_name}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {space.average_rating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" strokeWidth={0} />
                  <span className="font-bold text-zinc-900 text-[14px]">{space.average_rating}</span>
                  <span className="text-zinc-400 text-[13px]">({space.review_count} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[13px] text-zinc-500">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                {space.city} · {space.address}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={() => space && toggleFavorite(space.space_id)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-all ${saved ? "border-rose-300 bg-rose-50 text-rose-600" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"}`}>
              <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} strokeWidth={1.75} />
              {saved ? "Saved" : "Save"}
            </button>
            <button type="button" onClick={() => { navigator.clipboard.writeText(window.location.href); }}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[12.5px] font-semibold text-zinc-700 hover:border-zinc-300 transition-all">
              <Share2 className="h-4 w-4" strokeWidth={1.75} /> Share
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px]">
            <div className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer" onClick={() => { setGalleryStart(0); setGalleryOpen(true); }}>
              <img src={images[0]} alt={space.space_name}
                className="h-full w-full object-cover hover:scale-[1.03] transition-transform duration-500"
                onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"; }}
              />
            </div>
            {images.slice(1, 5).map((img, i) => (
              <div key={i} className="relative overflow-hidden cursor-pointer" onClick={() => { setGalleryStart(i + 1); setGalleryOpen(true); }}>
                <img src={img} alt="" className="h-full w-full object-cover hover:scale-[1.03] transition-transform duration-500"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80"; }}
                />
                {i === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer" onClick={() => setGalleryOpen(true)}>
                    <span className="text-white font-bold text-sm"><Grid2X2 className="h-5 w-5 inline mr-1.5" strokeWidth={1.75} />+{images.length - 5} more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div>
            {/* Description */}
            {space.space_description && (
              <div className="mb-8">
                <h2 className="font-display text-[20px] font-bold text-zinc-950 mb-3">About this space</h2>
                <p className="text-[14.5px] text-zinc-600 leading-relaxed">{space.space_description}</p>
              </div>
            )}

            {/* What's included */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-[20px] font-bold text-zinc-950">What's included</h2>
                <span className="text-xs font-semibold text-zinc-400">
                  {((space.amenities && space.amenities.length > 0) ? space.amenities.length : 4)} amenities included
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(space.amenities && space.amenities.length > 0
                  ? space.amenities
                  : ["wifi", "coffee", "24/7", "chair"]
                ).map((amenityId) => (
                  <AmenityCard key={amenityId} id={amenityId} />
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="mb-8 flex items-center gap-6 p-5 bg-white rounded-2xl border border-zinc-200/70">
              <div className="text-center">
                <p className="text-[28px] font-extrabold text-zinc-950 tabular-nums">{space.available_spots}</p>
                <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Spots</p>
              </div>
              <div className="w-px h-12 bg-zinc-200" />
              <div className="text-center">
                <p className="text-[28px] font-extrabold text-zinc-950 tabular-nums">€{space.price_per_hour}</p>
                <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Per hour</p>
              </div>
              <div className="w-px h-12 bg-zinc-200" />
              <div className="text-center">
                <p className="text-[28px] font-extrabold text-zinc-950 tabular-nums">€{space.price_per_day}</p>
                <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">Per day</p>
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-[20px] font-bold text-zinc-950">
                    Reviews
                    {space.average_rating && (
                      <span className="ml-2 text-[16px] font-medium text-zinc-400">· ⭐ {space.average_rating} ({space.review_count})</span>
                    )}
                  </h2>
                </div>
                <div className="space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.review_id} className="p-5 bg-white rounded-2xl border border-zinc-200/70">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[13px] font-bold">
                            {rev.user.name[0] ?? rev.user.username[0]}
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-zinc-900">{rev.user.name}</p>
                            <p className="text-[11.5px] text-zinc-400">{new Date(rev.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`} strokeWidth={0} />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-[13.5px] text-zinc-600 leading-relaxed">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <BookingWidget space={space} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}