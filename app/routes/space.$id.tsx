import { useState } from "react";
import { Link, useParams } from "react-router";
import { Star, MapPin, ChevronLeft, Heart, Share2, Grid2X2 } from "lucide-react";
import type { Route } from "./+types/space.$id";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { COWORKING_SPACES } from "../data/coworkings";

export function meta({ params }: Route.MetaArgs) {
  const space = COWORKING_SPACES.find(s => s.id === params.id);
  return [
    { title: space ? `${space.name} — Monet` : "Space — Monet" },
    { name: "description", content: space?.description ?? "Book a premium coworking space on Monet." },
  ];
}

export default function SpaceDetail() {
  const { id } = useParams();
  const [saved, setSaved] = useState(false);
  const space = COWORKING_SPACES.find(s => s.id === id);

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#f8f6f2" }}>
        <Navbar />
        <p className="text-zinc-500 text-lg font-medium">Space not found.</p>
        <Link to="/search" className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors">
          Browse spaces
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20">

        <nav className="flex items-center gap-2 text-[12.5px] text-zinc-400 font-medium mb-5">
          <Link to="/" className="hover:text-zinc-700 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/search" className="hover:text-zinc-700 transition-colors">Spaces</Link>
          <span>/</span>
          <span className="text-zinc-600 truncate">{space.name}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {space.badge && (
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-amber-700 mb-2">
                {space.badge}
              </span>
            )}
            <h1 className="font-display text-[28px] sm:text-[32px] font-extrabold tracking-tight text-zinc-950 leading-tight">{space.name}</h1>
            <p className="flex items-center gap-2 mt-2 text-[13px] text-zinc-500">
              <Star className="h-3.5 w-3.5 text-zinc-900" fill="currentColor" />
              <span className="font-bold text-zinc-900 tabular-nums">{space.rating}</span>
              <span className="text-zinc-400">({space.reviewCount} reviews)</span>
              <span>·</span>
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
              {space.address}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-zinc-600 hover:border-zinc-300 transition-colors shadow-sm">
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Share
            </button>
            <button type="button" onClick={() => setSaved(s => !s)}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-zinc-600 hover:border-zinc-300 transition-colors shadow-sm">
              <Heart className={`h-3.5 w-3.5 transition-colors ${saved ? "fill-rose-500 text-rose-500" : ""}`} strokeWidth={saved ? 0 : 1.75} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] sm:h-[480px] rounded-3xl overflow-hidden mb-10 cursor-pointer">
          <div className="col-span-2 row-span-2 relative group">
            <img src={space.images[0]} alt={space.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {space.images.slice(1, 5).map((img, i) => (
            <div key={i} className="relative group overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {i === 3 && (
                <div className="absolute inset-0 flex items-end justify-end p-3">
                  <span className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-[12px] font-bold text-zinc-800 shadow-sm">
                    <Grid2X2 className="h-3.5 w-3.5" strokeWidth={2} /> Show all photos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h2 className="font-display text-xl font-extrabold text-zinc-950 mb-3">About this space</h2>
          <p className="text-[14px] text-zinc-600 leading-relaxed">{space.description}</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}