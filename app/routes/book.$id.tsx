import { useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router";
import { ChevronLeft, Star, MapPin, User, Mail, Phone } from "lucide-react";
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

interface FormData {
  firstName: string; lastName: string;
  email: string; phone: string; notes: string;
}

interface FormErrors { [key: string]: string }

function validate(f: FormData): FormErrors {
  const e: FormErrors = {};
  if (!f.firstName.trim()) e.firstName = "Required";
  if (!f.lastName.trim())  e.lastName  = "Required";
  if (!f.email.trim() || !f.email.includes("@")) e.email = "Valid email required";
  return e;
}

export default function BookSpace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const space = COWORKING_SPACES.find(s => s.id === id);

  const dateParam  = searchParams.get("date")  ?? "";
  const desksParam = Number(searchParams.get("desks") ?? "1");
  const modeParam  = (searchParams.get("mode") ?? "day") as PriceMode;
  const [priceMode] = useState<PriceMode>(modeParam);

  const [form, setForm]     = useState<FormData>({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#f8f6f2" }}>
        <p className="text-zinc-500 font-medium">Space not found.</p>
        <Link to="/search" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white">Browse spaces</Link>
      </div>
    );
  }

  const price      = priceMode === "hour" ? space.priceHour : priceMode === "month" ? space.priceMonth : space.priceDay;
  const subtotal   = price * desksParam;
  const serviceFee = Math.round(subtotal * 0.08);
  const total      = subtotal + serviceFee;

  const field = (label: string, key: keyof FormData, type = "text", icon?: React.ReactNode) => (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</div>}
        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={label}
          className={`w-full rounded-xl border ${errors[key] ? "border-rose-400 bg-rose-50" : "border-zinc-200 bg-zinc-50"} ${icon ? "pl-10" : "pl-4"} pr-4 py-3 text-[13.5px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all`} />
        {errors[key] && <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors[key]}</p>}
      </div>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    // Payment step next
  };

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
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-6 sm:p-8 space-y-5">
              <h2 className="font-display text-[18px] font-extrabold text-zinc-950">Your details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("First name", "firstName", "text", <User className="h-4 w-4" strokeWidth={1.75} />)}
                {field("Last name",  "lastName",  "text")}
              </div>
              {field("Email", "email", "email", <Mail className="h-4 w-4" strokeWidth={1.75} />)}
              {field("Phone (optional)", "phone", "tel",  <Phone className="h-4 w-4" strokeWidth={1.75} />)}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Any special requirements?"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[13.5px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
              </div>
              <button type="submit"
                className="w-full rounded-xl bg-blue-600 py-4 text-[14px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25">
                Continue to payment
              </button>
            </form>
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
              <div className="px-5 py-4 text-[12.5px] text-zinc-500 border-b border-zinc-100 space-y-1">
                <div className="flex justify-between"><span>Date</span><span className="font-medium text-zinc-700">{dateParam || "Flexible"}</span></div>
                <div className="flex justify-between"><span>Desks</span><span className="font-medium text-zinc-700">{desksParam}</span></div>
                <div className="flex justify-between"><span>Duration</span><span className="font-medium text-zinc-700 capitalize">{priceMode} pass</span></div>
              </div>
              <div className="p-5 space-y-2.5 text-[13px]">
                <div className="flex justify-between text-zinc-600"><span>EUR{price} x {desksParam} {desksParam === 1 ? "desk" : "desks"}</span><span className="tabular-nums">EUR{subtotal}</span></div>
                <div className="flex justify-between text-zinc-600"><span>Service fee (8%)</span><span className="tabular-nums">EUR{serviceFee}</span></div>
                <div className="flex justify-between font-extrabold text-zinc-950 text-[15px] pt-2 border-t border-zinc-100">
                  <span>Total</span><span className="tabular-nums">EUR{total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}