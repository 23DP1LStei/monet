import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Star, MapPin, Wifi, Key, Coffee, Shield, ChevronLeft,
  ChevronRight, Heart, Zap, Share2, Grid2X2, X,
  CheckCircle, Clock, Users, Calendar,
} from "lucide-react";
import type { Route } from "./+types/space.$id";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { COWORKING_SPACES } from "../data/coworkings";

export function meta({ params }: Route.MetaArgs) {
  const space = COWORKING_SPACES.find(s => s.id === params.id);
  return [
    { title: space ? `${space.name} ΓÇö Monet` : "Space ΓÇö Monet" },
    { name: "description", content: space?.description ?? "Book a premium coworking space on Monet." },
  ];
}

const HIGHLIGHT_ICONS: Record<string, React.ReactNode> = {
  wifi:    <Wifi    className="h-5 w-5" strokeWidth={1.75} />,
  key:     <Key     className="h-5 w-5" strokeWidth={1.75} />,
  coffee:  <Coffee  className="h-5 w-5" strokeWidth={1.75} />,
  shield:  <Shield  className="h-5 w-5" strokeWidth={1.75} />,
};

type PriceMode = "hour" | "day" | "month";

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
          <img src={images[idx]} alt="" className="w-full h-full object-cover" />
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

function BookingWidget({ priceHour, priceDay, priceMonth, isInstantBook, name, spaceId }: {
  priceHour: number; priceDay: number; priceMonth: number; isInstantBook: boolean; name: string; spaceId: string;) {
  const navigate = useNavigate();
  const [priceMode, setPriceMode] = useState<PriceMode>("day");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const price = priceMode === "hour" ? priceHour : priceMode === "month" ? priceMonth : priceDay;
  const serviceFee = Math.round(price * guests * 0.08);
  const total = price * guests + serviceFee;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-6">
      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="text-[26px] font-extrabold text-zinc-950 tabular-nums">EUR{price}</span>
        <span className="text-[13px] text-zinc-400">/ {priceMode === "hour" ? "hr" : priceMode === "month" ? "mo" : "day"}</span>
      </div>
      <div className="flex items-center rounded-xl bg-zinc-100 p-0.5 mb-5 text-[12px] font-semibold">
        {(["hour", "day", "month"] as PriceMode[]).map(m => (
          <button key={m} type="button" onClick={() => setPriceMode(m)}
            className={`flex-1 rounded-[10px] py-2 transition-all ${priceMode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}>
            {m === "hour" ? "Hourly" : m === "day" ? "Day pass" : "Monthly"}
          </button>
        ))}
      </div>
      <div className="mb-3">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Date</label>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-3 text-[13.5px] font-medium text-zinc-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
        </div>
      </div>
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
            <button type="button" onClick={() => setGuests(g => Math.min(10, g + 1))}
              className="h-7 w-7 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:border-zinc-400 transition-colors">+</button>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => navigate(`/book/${spaceId}?date=${date}&desks=${guests}&mode=${priceMode}`)}
        className="w-full rounded-xl bg-blue-600 py-4 text-[14px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 mb-4">
        {isInstantBook ? <><Zap className="h-4 w-4" fill="currentColor" /> Book instantly</> : <><Clock className="h-4 w-4" strokeWidth={1.75} /> Request to book</>}
      </button>
      <div className="space-y-2 text-[13px] border-t border-zinc-100 pt-4">
        <div className="flex justify-between text-zinc-600"><span>EUR{price} x {guests} {guests === 1 ? "desk" : "desks"}</span><span className="tabular-nums">EUR{price * guests}</span></div>
        <div className="flex justify-between text-zinc-600"><span>Service fee</span><span className="tabular-nums">EUR{serviceFee}</span></div>
        <div className="flex justify-between font-bold text-zinc-900 pt-2 border-t border-zinc-100 text-[14px]"><span>Total</span><span className="tabular-nums">EUR{total}</span></div>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-400">Free cancellation before check-in</p>
    </div>
  );
}

export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const space = COWORKING_SPACES.find(s => s.id === id);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#f8f6f2" }}>
        <Navbar />
        <p className="text-zinc-500 text-lg font-medium">Space not found.</p>
        <Link to="/search" className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors">Browse spaces</Link>
      </div>
    );
  }

  const openGallery = (i: number) => { setGalleryStart(i); setGalleryOpen(true); };

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />
      {galleryOpen && <GalleryModal images={space.images} startIndex={galleryStart} onClose={() => setGalleryOpen(false)} />}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <nav className="flex items-center gap-2 text-[12.5px] text-zinc-400 font-medium mb-5">
          <Link to="/" className="hover:text-zinc-700 transition-colors">Home</Link><span>/</span>
          <Link to="/search" className="hover:text-zinc-700 transition-colors">Spaces</Link><span>/</span>
          <Link to={`/search?location=${space.city}`} className="hover:text-zinc-700 transition-colors">{space.city}</Link><span>/</span>
          <span className="text-zinc-600 truncate">{space.name}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {space.badge && <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-amber-700">{space.badge}</span>}
              {space.isInstantBook && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-[11px] font-bold text-blue-700"><Zap className="h-3 w-3" fill="currentColor" /> Instant Book</span>}
            </div>
            <h1 className="font-display text-[26px] sm:text-[32px] font-extrabold tracking-tight text-zinc-950 leading-tight">{space.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[13px] text-zinc-500">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-zinc-900" fill="currentColor" /><span className="font-bold text-zinc-900 tabular-nums">{space.rating}</span><span className="text-zinc-400">({space.reviewCount} reviews)</span></span>
              <span>┬╖</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{space.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-zinc-600 hover:border-zinc-300 transition-colors shadow-sm"><Share2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Share</button>
            <button type="button" onClick={() => setSaved(s => !s)} className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-zinc-600 hover:border-zinc-300 transition-colors shadow-sm">
              <Heart className={`h-3.5 w-3.5 transition-colors ${saved ? "fill-rose-500 text-rose-500" : ""}`} strokeWidth={saved ? 0 : 1.75} />{saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] sm:h-[480px] rounded-3xl overflow-hidden mb-10 cursor-pointer">
          <div className="col-span-2 row-span-2 relative group" onClick={() => openGallery(0)}>
            <img src={space.images[0]} alt={space.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {space.images.slice(1, 5).map((img, i) => (
            <div key={i} className="relative group overflow-hidden" onClick={() => openGallery(i + 1)}>
              <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {i === 3 && (
                <button className="absolute inset-0 flex items-end justify-end p-3" onClick={e => { e.stopPropagation(); openGallery(0); }}>
                  <span className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-[12px] font-bold text-zinc-800 shadow-sm backdrop-blur-sm hover:bg-white transition-colors">
                    <Grid2X2 className="h-3.5 w-3.5" strokeWidth={2} /> Show all photos
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-12 items-start">
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 pb-10 border-b border-zinc-200/60">
              {space.highlights.map(h => (
                <div key={h.title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">{HIGHLIGHT_ICONS[h.icon]}</div>
                  <div>
                    <p className="text-[13.5px] font-bold text-zinc-900">{h.title}</p>
                    <p className="text-[12.5px] text-zinc-500 leading-snug mt-0.5">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-10 pb-10 border-b border-zinc-200/60">
              <h2 className="font-display text-[18px] font-extrabold text-zinc-950 mb-3">About this space</h2>
              <p className="text-[14px] text-zinc-600 leading-relaxed">{space.description}</p>
            </div>
            <div className="mb-10 pb-10 border-b border-zinc-200/60">
              <h2 className="font-display text-[18px] font-extrabold text-zinc-950 mb-5">What is included</h2>
              <div className="grid grid-cols-2 gap-3">
                {space.amenities.map(a => (
                  <div key={a} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                    <span className="text-[13px] text-zinc-700 font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-10 pb-10 border-b border-zinc-200/60">
              <h2 className="font-display text-[18px] font-extrabold text-zinc-950 mb-5">House rules</h2>
              <ul className="space-y-3">
                {space.rules.map(r => (
                  <li key={r} className="flex items-start gap-3 text-[13px] text-zinc-600">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="font-display text-[18px] font-extrabold text-zinc-950">Reviews</h2>
                <div className="flex items-center gap-1.5 bg-zinc-950 text-white rounded-xl px-3 py-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                  <span className="text-[13px] font-bold tabular-nums">{space.rating}</span>
                  <span className="text-[12px] text-zinc-400">({space.reviewCount})</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {space.reviews.map(r => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white rounded-2xl p-5 border border-zinc-200/60 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img src={r.avatar} alt={r.author} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
                        <div>
                          <p className="text-[13px] font-bold text-zinc-900">{r.author}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{r.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 text-amber-500" fill="currentColor" />)}
                      </div>
                    </div>
                    <p className="text-[13px] text-zinc-600 leading-relaxed">{r.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-[360px] flex-shrink-0 sticky top-[88px]">
            <BookingWidget priceHour={space.priceHour} priceDay={space.priceDay} priceMonth={space.priceMonth}
              isInstantBook={space.isInstantBook} name={space.name} spaceId={space.id} />
            <div className="mt-4 bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" strokeWidth={2} />
                <span className="text-[13px] font-bold text-zinc-900">Free cancellation</span>
              </div>
              <p className="text-[12px] text-zinc-500 leading-relaxed">Cancel before check-in for a full refund. No questions asked.</p>
            </div>
            <p className="mt-4 text-center text-[11.5px] text-zinc-400 leading-snug">You will not be charged yet. Price shown excludes local taxes.</p>
          </div>
        </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-sm px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[20px] font-extrabold text-zinc-950 tabular-nums">EUR{space.priceDay}</span>
            <span className="text-[13px] text-zinc-400 ml-1">/ day</span>
          </div>
          <button type="button" className="rounded-xl bg-blue-600 px-6 py-3 text-[14px] font-bold text-white hover:bg-blue-700 active:scale-[0.97] transition-all shadow-md shadow-blue-600/25 flex items-center gap-2">
            {space.isInstantBook ? <><Zap className="h-4 w-4" fill="currentColor" /> Book now</> : "Request to book"}
          </button>
        </div>
      </div>

      </div>

      <Footer />
    </div>
  );
}