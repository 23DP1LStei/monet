import { useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router";
import { ChevronLeft, Star, MapPin } from "lucide-react";
import type { Route } from "./+types/book.$id";
import { Navbar } from "../components/Navbar";
import { COWORKING_SPACES } from "../data/coworkings";

export function meta({ params }: Route.MetaArgs) {
  const space = COWORKING_SPACES.find(s => s.id === params.id);
  return [
    { title: space ? `Book ${space.name} — Monet` : "Book — Monet" },
    { name: "description", content: "Confirm your coworking space booking." },
  ];
}

type PriceMode = "hour" | "day" | "month";

export default function BookSpace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const space = COWORKING_SPACES.find(s => s.id === id);

  const dateParam  = searchParams.get("date")  ?? "";
  const desksParam = Number(searchParams.get("desks") ?? "1");
  const modeParam  = (searchParams.get("mode") ?? "day") as PriceMode;

  const [date]      = useState(dateParam);
  const [desks]     = useState(desksParam);
  const [priceMode] = useState<PriceMode>(modeParam);

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#f8f6f2" }}>
        <p className="text-zinc-500 font-medium">Space not found.</p>
        <Link to="/search" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white">Browse spaces</Link>
      </div>
    );
  }

  const price      = priceMode === "hour" ? space.priceHour : priceMode === "month" ? space.priceMonth : space.priceDay;
  const subtotal   = price * desks;
  const serviceFee = Math.round(subtotal * 0.08);
  const total      = subtotal + serviceFee;

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 pb-28">
        <button type="button" onClick={() => navigate(`/space/${space.id}`)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors mb-7">
          <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Back to space
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-6">
              <h2 className="font-display text-[16px] font-extrabold text-zinc-950 mb-4">Your details</h2>
              <p className="text-sm text-zinc-400">Contact form coming next...</p>
            </div>
          </div>

          <div className="w-full lg:w-[360px] flex-shrink-0 lg:sticky lg:top-[88px]">
            <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-5 border-b border-zinc-100">
                <div className="w-24 rounded-xl overflow-hidden flex-shrink-0 aspect-[4/3]">
                  <img src={space.images[0]} alt={space.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-zinc-950 leading-snug line-clamp-2">{space.name}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin className="h-3 w-3 text-zinc-400" strokeWidth={1.75} />
                    <p className="text-[11.5px] text-zinc-500 truncate">{space.district}, {space.city}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-zinc-900" fill="currentColor" />
                    <span className="text-[12px] font-bold text-zinc-900 tabular-nums">{space.rating}</span>
                    <span className="text-[11px] text-zinc-400">({space.reviewCount})</span>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-2.5 text-[13px]">
                <div className="flex justify-between text-zinc-600">
                  <span>EUR{price} x {desks} {desks === 1 ? "desk" : "desks"}</span>
                  <span className="tabular-nums">EUR{subtotal}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Service fee (8%)</span>
                  <span className="tabular-nums">EUR{serviceFee}</span>
                </div>
                <div className="flex justify-between font-extrabold text-zinc-950 text-[15px] pt-2 border-t border-zinc-100">
                  <span>Total</span>
                  <span className="tabular-nums">EUR{total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}