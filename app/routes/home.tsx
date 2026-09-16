import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { Navbar } from "../components/Navbar";
import { SearchBar } from "../components/SearchBar";
import { SpaceCard } from "../components/SpaceCard";
import { Footer } from "../components/Footer";
import { COWORKING_SPACES } from "../data/coworkings";
import { ArrowRight } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Monet â€” Book Beautiful Coworking Spaces" },
    { name: "description", content: "Find and book curated coworking spaces in Riga, Tallinn, Vilnius and Europe." },
  ];
}

const CITIES = ["All", "Riga", "Tallinn", "Vilnius", "Berlin"] as const;
type City = typeof CITIES[number];

export default function Home() {
  const [city,      setCity]      = useState<City>("All");
  const [priceMode, setPriceMode] = useState<"hour" | "day" | "month">("day");

  const spaces = city === "All"
    ? COWORKING_SPACES
    : COWORKING_SPACES.filter(s => s.city === city);

  return (
    <div className="min-h-screen text-zinc-900" style={{ background: "#f8f6f2" }}>
      <Navbar />

      <section className="py-20 px-4 text-center">
        <h1 className="font-display text-5xl font-extrabold text-zinc-950 mb-4 tracking-tight">
          Find your space.
        </h1>
        <p className="text-zinc-500 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          Book premium coworking desks, studios, and meeting rooms. No memberships.
        </p>
        <SearchBar />
      </section>

      <section className="py-14 border-t border-zinc-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-extrabold text-zinc-950">Trending spaces</h2>
            <div className="flex gap-1.5">
              {CITIES.map(c => (
                <button key={c} type="button" onClick={() => setCity(c)}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all ${city === c ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-800"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((s, i) => <SpaceCard key={s.id} space={s} priceMode={priceMode} index={i} />)}
          </div>
          <div className="mt-10 text-center">
            <Link to="/search"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-bold text-zinc-900 hover:border-zinc-400 hover:shadow transition-all">
              Explore all spaces <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
