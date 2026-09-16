import { useState } from "react";
import { Link } from "react-router";
import { Heart, Star, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import type { CoworkingSpace } from "../data/coworkings";

interface Props {
  space: CoworkingSpace;
  priceMode?: "hour" | "day" | "month";
  index?: number;
}

export function SpaceCard({ space, priceMode = "day", index = 0 }: Props) {
  const [imgIndex, setImgIndex] = useState(0);
  const [saved,    setSaved]    = useState(false);
  const [hovered,  setHovered]  = useState(false);

  const price =
    priceMode === "hour"  ? space.priceHour  :
    priceMode === "month" ? space.priceMonth :
    space.priceDay;

  const labels: Record<string, string> = { hour: "hr", day: "day", month: "mo" };

  return (
    <Link
      to={`/space/${space.id}`}
      className="block group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100">
        <img
          src={space.images[imgIndex]}
          alt={space.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />

        {space.badge && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-zinc-900 shadow-sm">
            {space.badge}
          </div>
        )}

        {space.isInstantBook && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-blue-600 rounded-lg px-2 py-1 text-[11px] font-semibold text-white shadow-sm">
            <Zap className="h-3 w-3" fill="currentColor" />
            Instant Book
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }}
          className="absolute top-3 right-3 p-2 rounded-full transition-all hover:scale-110 active:scale-95"
        >
          <Heart className={`h-5 w-5 transition-all duration-200 ${saved ? "fill-rose-500 text-rose-500" : "text-white drop-shadow-md"}`} strokeWidth={saved ? 0 : 2} />
        </button>

        {hovered && space.images.length > 1 && (
          <>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((i) => (i - 1 + space.images.length) % space.images.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-md" aria-label="prev">
              <ChevronLeft className="h-4 w-4 text-zinc-800" strokeWidth={2} />
            </button>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((i) => (i + 1) % space.images.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-md" aria-label="next">
              <ChevronRight className="h-4 w-4 text-zinc-800" strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      <div className="mt-3 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-semibold text-zinc-900 truncate">{space.name}</h3>
            <p className="text-[12px] text-zinc-500 mt-0.5">{space.district}, {space.city}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            <Star className="h-3.5 w-3.5 text-zinc-900" fill="currentColor" />
            <span className="text-[13px] font-semibold tabular-nums">{space.rating}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-[13.5px] font-bold text-zinc-900 tabular-nums">â‚¬{price}</span>
          <span className="text-[12px] text-zinc-500"> / {labels[priceMode]}</span>
        </div>
      </div>
    </Link>
  );
}
