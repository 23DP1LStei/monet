import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Star, Zap, Heart, MapPin } from "lucide-react";
import type { Route } from "./+types/search";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { COWORKING_SPACES, type CoworkingSpace } from "../data/coworkings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search Spaces — Monet" },
    { name: "description", content: "Find and book coworking spaces across Europe." },
  ];
}

type PriceMode = "hour" | "day" | "month";

function SpaceCardRow({ space, priceMode }: { space: CoworkingSpace; priceMode: PriceMode }) {
  const [saved, setSaved] = useState(false);
  const price = priceMode === "hour" ? space.priceHour : priceMode === "month" ? space.priceMonth : space.priceDay;
  const label = priceMode === "hour" ? "hr" : priceMode === "month" ? "mo" : "day";

  return (
    <div className="group flex bg-white rounded-2xl overflow-hidden border border-zinc-200/70 shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/space/${space.id}`} className="relative w-[200px] flex-shrink-0 overflow-hidden">
        <img src={space.images[0]} alt={space.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        {space.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-zinc-900 shadow-sm">
            {space.badge}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col justify-between p-5 min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/space/${space.id}`}>
                <h2 className="text-[15px] font-bold text-zinc-950 hover:underline truncate">{space.name}</h2>
              </Link>
              <p className="text-[12.5px] text-zinc-500 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {space.district}, {space.city}
              </p>
            </div>
            <button type="button" onClick={() => setSaved(!saved)}
              className="mt-0.5 p-1.5 rounded-full hover:bg-zinc-100 transition-colors flex-shrink-0">
              <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`}
                strokeWidth={saved ? 0 : 1.75} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-zinc-900" fill="currentColor" />
            <span className="text-[13px] font-semibold tabular-nums">{space.rating}</span>
            {space.isInstantBook && (
              <span className="ml-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                <Zap className="h-3 w-3" fill="currentColor" /> Instant
              </span>
            )}
          </div>
          <div>
            <span className="text-[16px] font-extrabold text-zinc-950 tabular-nums">EUR{price}</span>
            <span className="text-[12px] text-zinc-400"> / {label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const [priceMode, setPriceMode] = useState<PriceMode>("day");
  const locationParam = searchParams.get("location") ?? "";

  const results = COWORKING_SPACES.filter(s =>
    locationParam ? s.city.toLowerCase() === locationParam.toLowerCase() : true
  );

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
        <div className="flex gap-6">
          <div className="flex-1 min-w-0 space-y-4">
            {results.map(space => (
              <SpaceCardRow key={space.id} space={space} priceMode={priceMode} />
            ))}
          </div>
          <div className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-sm text-zinc-400">
              Filters coming soon
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}