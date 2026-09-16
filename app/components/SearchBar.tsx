import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Search } from "lucide-react";

const LOCATIONS = [
  { city: "Riga",    area: "Old Town & Central",     count: 34, emoji: "ðŸ›ï¸" },
  { city: "Riga",    area: "Andrejsala",              count: 28, emoji: "ðŸŒŠ" },
  { city: "Riga",    area: "Skanste Tech District",   count: 19, emoji: "ðŸ”¬" },
  { city: "Tallinn", area: "Telliskivi Creative City",count: 42, emoji: "ðŸŽ¨" },
  { city: "Vilnius", area: "Tech Park",               count: 31, emoji: "ðŸŒ¿" },
  { city: "Berlin",  area: "Mitte & Kreuzberg",       count: 86, emoji: "ðŸ»" },
];

const SPACE_TYPES = [
  { id: "hot-desk",       label: "Hot Desk",       desc: "Flexible open seat" },
  { id: "dedicated",      label: "Dedicated Desk", desc: "Your permanent spot" },
  { id: "private-office", label: "Private Office", desc: "Enclosed office for 1â€“12" },
  { id: "meeting-room",   label: "Meeting Room",   desc: "Equipped pods for calls" },
];

type Section = "location" | "date" | "type" | null;

export function SearchBar() {
  const navigate = useNavigate();
  const [active,    setActive]   = useState<Section>(null);
  const [query,     setQuery]    = useState("");
  const [location,  setLocation] = useState<typeof LOCATIONS[0]  | null>(null);
  const [date,      setDate]     = useState("");
  const [spaceType, setSpaceType]= useState<typeof SPACE_TYPES[0]| null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = LOCATIONS.filter(l =>
    `${l.city} ${l.area}`.toLowerCase().includes(query.toLowerCase())
  );

  const search = () => {
    const p = new URLSearchParams();
    if (location)   p.set("location", location.city);
    if (date)       p.set("date", date);
    if (spaceType)  p.set("type", spaceType.id);
    navigate(`/search?${p.toString()}`);
  };

  const open  = (s: Section) => setActive(prev => prev === s ? null : s);
  const close = () => setActive(null);

  const divider = <div className="w-px h-8 bg-zinc-200/80 flex-shrink-0 self-center" />;

  return (
    <div className="relative mx-auto max-w-3xl w-full">
      <div className={`flex items-stretch bg-white rounded-full border transition-all duration-200 ${active ? "border-transparent shadow-[0_8px_40px_rgba(0,0,0,0.18)]" : "border-zinc-300/80 shadow-[0_2px_16px_rgba(0,0,0,0.10)]"}`}>

        <button type="button" id="search-location"
          onClick={() => { open("location"); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex flex-col justify-center text-left px-6 py-3.5 rounded-full min-w-[180px] hover:bg-zinc-50/80 transition-colors">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 leading-none mb-1">Where</span>
          <span className={`text-[13.5px] font-medium leading-none truncate ${location ? "text-zinc-900" : "text-zinc-400"}`}>
            {location ? `${location.city} Â· ${location.area.split("&")[0].trim()}` : "Search destinations"}
          </span>
        </button>

        {divider}

        <button type="button" id="search-date" onClick={() => open("date")}
          className="flex flex-col justify-center text-left px-6 py-3.5 rounded-full flex-1 hover:bg-zinc-50/80 transition-colors">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 leading-none mb-1">When</span>
          <span className={`text-[13.5px] font-medium leading-none ${date ? "text-zinc-900" : "text-zinc-400"}`}>{date || "Add date"}</span>
        </button>

        {divider}

        <button type="button" id="search-type" onClick={() => open("type")}
          className="flex flex-col justify-center text-left px-6 py-3.5 rounded-full flex-1 hover:bg-zinc-50/80 transition-colors">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 leading-none mb-1">Space type</span>
          <span className={`text-[13.5px] font-medium leading-none ${spaceType ? "text-zinc-900" : "text-zinc-400"}`}>{spaceType ? spaceType.label : "Any type"}</span>
        </button>

        <div className="flex items-center pr-2 pl-2 flex-shrink-0">
          <button type="button" id="search-submit" onClick={search}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3.5 text-white text-[13.5px] font-bold hover:bg-blue-700 active:scale-[0.97] shadow-md shadow-blue-600/30 transition-all duration-200">
            <Search className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:block">Search</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <>
            <div className="fixed inset-0 z-40" onClick={close} />
            <motion.div key={active}
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-[calc(100%+10px)] left-0 right-0 z-50 bg-white rounded-3xl shadow-[0_16px_60px_rgba(0,0,0,0.18)] border border-zinc-200/60 overflow-hidden">

              {active === "location" && (
                <div className="p-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 mb-3">
                    <MapPin className="h-4 w-4 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
                    <input ref={inputRef} type="text" placeholder="Where are you working?" value={query}
                      onChange={e => setQuery(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 outline-none" />
                  </div>
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
                    {filtered.map(loc => (
                      <button key={`${loc.city}-${loc.area}`} type="button"
                        onClick={() => { setLocation(loc); setQuery(""); close(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left">
                        <span className="text-xl w-8 text-center">{loc.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-zinc-900">{loc.city}</div>
                          <div className="text-xs text-zinc-500 truncate">{loc.area}</div>
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400 tabular-nums">{loc.count} spaces</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {active === "date" && (
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Quick select</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {["Today", "Tomorrow", "This week"].map(l => (
                      <button key={l} type="button" onClick={() => { setDate(l); close(); }}
                        className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${date === l ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 rounded-xl">
                    <Calendar className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                    <input type="date" value={date} onChange={e => { setDate(e.target.value); close(); }}
                      className="flex-1 bg-transparent text-sm text-zinc-700 outline-none" />
                  </div>
                </div>
              )}

              {active === "type" && (
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Space type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SPACE_TYPES.map(t => (
                      <button key={t.id} type="button" onClick={() => { setSpaceType(t); close(); }}
                        className={`text-left px-4 py-3.5 rounded-xl border transition-all ${spaceType?.id === t.id ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700"}`}>
                        <div className="text-sm font-semibold">{t.label}</div>
                        <div className={`text-[11px] mt-0.5 leading-snug ${spaceType?.id === t.id ? "text-blue-100" : "text-zinc-400"}`}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
