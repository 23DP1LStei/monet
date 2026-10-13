import { useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Star, Zap, Clock, CheckCircle, Shield,
  CreditCard, Lock, AlertCircle, MapPin, Calendar, Users,
} from "lucide-react";
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

/*  Success Screen  */
function SuccessScreen({ spaceName, date, code }: { spaceName: string; date: string; code: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#f8f6f2" }}>
      <div className="max-w-md w-full text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-[28px] font-extrabold text-zinc-950 mb-2 tracking-tight">You're booked!</h1>
        <p className="text-zinc-500 text-[15px] leading-relaxed mb-8">
          Your access code for <span className="font-semibold text-zinc-800">{spaceName}</span> on <span className="font-semibold text-zinc-800">{date || "your selected date"}</span> is ready.
        </p>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-8 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Your access code</p>
          <p className="font-mono text-[36px] font-bold tracking-[0.18em] text-zinc-950">{code}</p>
          <p className="text-[12px] text-zinc-400 mt-2">Valid on your booking date. Show at reception or enter on the keypad.</p>
        </div>
        <p className="text-[12px] text-zinc-400 mb-4">A confirmation has been sent to your email.</p>
        <div className="flex gap-3">
          <Link to="/"
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-[13.5px] font-bold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-center">
            Back to home
          </Link>
          <Link to="/search"
            className="flex-1 rounded-xl bg-blue-600 py-3 text-[13.5px] font-bold text-white hover:bg-blue-700 transition-all text-center">
            Browse more
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/*  Page  */
export default function BookSpace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const space = COWORKING_SPACES.find(s => s.id === id);

  const dateParam  = searchParams.get("date")  ?? "";
  const desksParam = Number(searchParams.get("desks") ?? "1");
  const modeParam  = (searchParams.get("mode") ?? "day") as PriceMode;

  const [step, setStep]         = useState<"details" | "payment" | "success">("details");
  const [date, setDate]         = useState(dateParam);
  const [desks, setDesks]       = useState(desksParam);
  const [priceMode]             = useState<PriceMode>(modeParam);
  const [loading, setLoading]   = useState(false);
  const [accessCode]            = useState(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );

  // Guest details
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [notes,     setNotes]     = useState("");

  // Payment
  const [cardNum,  setCardNum]  = useState("");
  const [expiry,   setExpiry]   = useState("");
  const [cvc,      setCvc]      = useState("");
  const [cardName, setCardName] = useState("");

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#f8f6f2" }}>
        <p className="text-zinc-500 font-medium">Space not found.</p>
        <Link to="/search" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white">Browse spaces</Link>
      </div>
    );
  }

  if (step === "success") {
    return <SuccessScreen spaceName={space.name} date={date} code={accessCode} />;
  }

  const price = priceMode === "hour" ? space.priceHour : priceMode === "month" ? space.priceMonth : space.priceDay;
  const label = priceMode === "hour" ? "hr" : priceMode === "month" ? "mo" : "day";
  const subtotal   = price * desks;
  const serviceFee = Math.round(subtotal * 0.08);
  const total      = subtotal + serviceFee;

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13.5px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 pb-28">

        {/* Back */}
        <button type="button" onClick={() => step === "payment" ? setStep("details") : navigate(`/space/${space.id}`)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors mb-7">
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          {step === "payment" ? "Back to details" : "Back to space"}
        </button>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {(["details", "payment"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-all ${step === s || (s === "details" && step === "payment") ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500"}`}>
                {s === "details" && step === "payment" ? <CheckCircle className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </div>
              <span className={`text-[13px] font-semibold ${step === s ? "text-zinc-900" : "text-zinc-400"}`}>
                {s === "details" ? "Your details" : "Payment"}
              </span>
              {i < 1 && <div className="w-10 h-px bg-zinc-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/*  Left: Form  */}
          <div className="flex-1 min-w-0">

            <AnimatePresence mode="wait">
              {step === "details" && (
                <motion.form key="details" onSubmit={handleDetailsNext}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }}>

                  {/* Trip details */}
                  <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-6 mb-5">
                    <h2 className="font-display text-[16px] font-extrabold text-zinc-950 mb-5">Trip details</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                          <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                            className={inputCls + " pl-10"} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Desks</label>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                            <input type="number" min={1} max={10} value={desks} onChange={e => setDesks(Number(e.target.value))}
                              className={inputCls + " pl-10"} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-[12.5px] text-zinc-500 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                      Free cancellation before check-in. No questions asked.
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-6 mb-5">
                    <h2 className="font-display text-[16px] font-extrabold text-zinc-950 mb-5">Contact information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">First name</label>
                        <input required placeholder="Max" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Last name</label>
                        <input required placeholder="Uttko" value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Email</label>
                        <input required type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Phone (optional)</label>
                        <input type="tel" placeholder="+371 2000 0000" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Notes for the host (optional)</label>
                        <textarea rows={3} placeholder="Any special requirements, arrival time, team size..." value={notes} onChange={e => setNotes(e.target.value)}
                          className={inputCls + " resize-none"} />
                      </div>
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full rounded-xl bg-blue-600 py-4 text-[14px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25">
                    Continue to payment →
                  </button>
                </motion.form>
              )}

              {step === "payment" && (
                <motion.form key="payment" onSubmit={handlePay}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.25 }}>

                  {/* Payment method */}
                  <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-6 mb-5">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display text-[16px] font-extrabold text-zinc-950">Payment method</h2>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                        <Lock className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
                        Secure & encrypted
                      </div>
                    </div>

                    {/* Accepted cards */}
                    <div className="flex items-center gap-2 mb-5 pb-5 border-b border-zinc-100">
                      {["VISA", "MC", "AMEX"].map(c => (
                        <div key={c} className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-500 tracking-wider">
                          {c}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Cardholder name</label>
                        <input required placeholder="Max Uttko" value={cardName} onChange={e => setCardName(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Card number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                          <input required placeholder="1234 5678 9012 3456"
                            value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))}
                            className={inputCls + " pl-10 font-mono tracking-wider"} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Expiry</label>
                          <input required placeholder="MM/YY"
                            value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                            className={inputCls + " font-mono"} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">CVC</label>
                          <input required placeholder="123" maxLength={4}
                            value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            className={inputCls + " font-mono"} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking summary mini */}
                  <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm p-5 mb-5">
                    <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
                      <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" strokeWidth={1.75} />
                      By confirming, you agree to Monet's{" "}
                      <span className="text-blue-600 hover:underline cursor-pointer font-medium">Terms of Service</span>{" "}
                      and{" "}
                      <span className="text-blue-600 hover:underline cursor-pointer font-medium">Cancellation Policy</span>.
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full rounded-xl bg-blue-600 py-4 text-[14px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing paymentΓÇª
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" strokeWidth={2} />
                        Confirm & pay — €{total}
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/*  Right: Order summary (sticky)  */}
          <div className="w-full lg:w-[360px] flex-shrink-0 lg:sticky lg:top-[88px]">
            <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm overflow-hidden">

              {/* Space info */}
              <div className="flex gap-4 p-5 border-b border-zinc-100">
                <div className="w-24 h-18 rounded-xl overflow-hidden flex-shrink-0 aspect-[4/3]">
                  <img src={space.images[0]} alt={space.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  {space.badge && (
                    <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-full px-2 py-0.5 mb-1">
                      {space.badge}
                    </span>
                  )}
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

              {/* Booking details */}
              <div className="p-5 border-b border-zinc-100">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Your booking</h3>
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} /> Date
                    </div>
                    <span className="font-semibold text-zinc-800">{date || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Users className="h-3.5 w-3.5" strokeWidth={1.75} /> Desks
                    </div>
                    <span className="font-semibold text-zinc-800">{desks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.75} /> Duration
                    </div>
                    <span className="font-semibold text-zinc-800 capitalize">{priceMode === "hour" ? "Hourly" : priceMode === "day" ? "Day pass" : "Monthly"}</span>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="p-5 border-b border-zinc-100 space-y-2.5 text-[13px]">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Price breakdown</h3>
                <div className="flex justify-between text-zinc-600">
                  <span>€{price} ├ù {desks} {desks === 1 ? "desk" : "desks"}</span>
                  <span className="tabular-nums">€{subtotal}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Service fee (8%)</span>
                  <span className="tabular-nums">€{serviceFee}</span>
                </div>
                <div className="flex justify-between font-extrabold text-zinc-950 text-[15px] pt-2 border-t border-zinc-100">
                  <span>Total</span>
                  <span className="tabular-nums">€{total}</span>
                </div>
              </div>

              {/* Badges */}
              <div className="p-5 space-y-2.5">
                {space.isInstantBook && (
                  <div className="flex items-center gap-2.5 text-[12.5px] font-medium text-zinc-600">
                    <Zap className="h-4 w-4 text-blue-600 flex-shrink-0" fill="currentColor" />
                    Instant confirmation — no waiting
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-[12.5px] font-medium text-zinc-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                  Free cancellation before check-in
                </div>
                <div className="flex items-center gap-2.5 text-[12.5px] font-medium text-zinc-600">
                  <Shield className="h-4 w-4 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
                  Verified space — Monet guarantee
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}