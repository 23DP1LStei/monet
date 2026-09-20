import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/search";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { COWORKING_SPACES } from "../data/coworkings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search Spaces — Monet" },
    { name: "description", content: "Find coworking spaces across Europe." },
  ];
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const locationParam = searchParams.get("location") ?? "";

  const results = COWORKING_SPACES.filter(s =>
    locationParam ? s.city.toLowerCase() === locationParam.toLowerCase() : true
  );

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-2xl font-extrabold text-zinc-950 mb-8">
          {locationParam ? `Spaces in ${locationParam}` : "All spaces"}
        </h1>
        <div className="space-y-4">
          {results.map(space => (
            <Link key={space.id} to={`/space/${space.id}`}
              className="block bg-white rounded-2xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <img src={space.images[0]} alt={space.name}
                  className="w-32 h-24 object-cover rounded-xl flex-shrink-0" />
                <div>
                  <h2 className="font-bold text-zinc-900">{space.name}</h2>
                  <p className="text-sm text-zinc-500">{space.district}, {space.city}</p>
                  <p className="mt-2 font-semibold text-zinc-900">EUR{space.priceDay} / day</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}