import React from "react";
import {
  Wifi,
  Coffee,
  Clock,
  Shield,
  PhoneCall,
  Users,
  Monitor,
  Printer,
  Car,
  Utensils,
  Bath,
  Dog,
  Bike,
  Sparkles,
  Tv,
  CheckCircle,
  Check,
} from "lucide-react";
import { getAmenityInfo, AMENITIES_CATALOG, type AmenityDefinition } from "../lib/api-types";

// Icon mapping
export function AmenityIcon({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) {
  switch (name) {
    case "Wifi":
      return <Wifi className={className} strokeWidth={1.8} />;
    case "Coffee":
      return <Coffee className={className} strokeWidth={1.8} />;
    case "Clock":
      return <Clock className={className} strokeWidth={1.8} />;
    case "Shield":
      return <Shield className={className} strokeWidth={1.8} />;
    case "PhoneCall":
      return <PhoneCall className={className} strokeWidth={1.8} />;
    case "Users":
      return <Users className={className} strokeWidth={1.8} />;
    case "Monitor":
      return <Monitor className={className} strokeWidth={1.8} />;
    case "Printer":
      return <Printer className={className} strokeWidth={1.8} />;
    case "Car":
      return <Car className={className} strokeWidth={1.8} />;
    case "Utensils":
      return <Utensils className={className} strokeWidth={1.8} />;
    case "Bath":
      return <Bath className={className} strokeWidth={1.8} />;
    case "Dog":
      return <Dog className={className} strokeWidth={1.8} />;
    case "Bike":
      return <Bike className={className} strokeWidth={1.8} />;
    case "Tv":
      return <Tv className={className} strokeWidth={1.8} />;
    case "Sparkles":
    default:
      return <Sparkles className={className} strokeWidth={1.8} />;
  }
}

// Category styling tokens for rich aesthetic visual variety
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  essentials: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200/60 dark:border-blue-900/40" },
  productivity: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200/60 dark:border-purple-900/40" },
  comfort: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200/60 dark:border-amber-900/40" },
  facility: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-900/40" },
};

/**
 * Rich Card for Space Details Page
 */
export function AmenityCard({ id }: { id: string }) {
  const item = getAmenityInfo(id);
  const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.essentials;

  return (
    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${color.bg} ${color.text} ${color.border}`}>
        <AmenityIcon name={item.iconName} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-0.5">
          {item.label}
        </p>
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact Pill Badge for list views / cards
 */
export function AmenityBadge({ id }: { id: string }) {
  const item = getAmenityInfo(id);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
      <AmenityIcon name={item.iconName} className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
      <span>{item.shortLabel}</span>
    </span>
  );
}

/**
 * Interactive Amenity Selector for Host / Admin Modals
 */
export function AmenitySelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (newSelected: string[]) => void;
}) {
  const toggleAmenity = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          What's Included ({selected.length} selected)
        </label>
        <button
          type="button"
          onClick={() => {
            if (selected.length === AMENITIES_CATALOG.length) {
              onChange([]);
            } else {
              onChange(AMENITIES_CATALOG.map((a) => a.id));
            }
          }}
          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {selected.length === AMENITIES_CATALOG.length ? "Deselect all" : "Select all"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AMENITIES_CATALOG.map((amenity) => {
          const isSelected = selected.includes(amenity.id);
          return (
            <button
              key={amenity.id}
              type="button"
              onClick={() => toggleAmenity(amenity.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                isSelected
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm font-semibold"
                  : "bg-white dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 font-medium"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? "bg-white/20 dark:bg-black/10 text-white dark:text-zinc-950"
                    : "bg-zinc-100 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {isSelected ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <AmenityIcon name={amenity.iconName} className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="text-[11.5px] truncate">{amenity.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
