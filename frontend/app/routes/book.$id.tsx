import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Star, Zap, Clock, CheckCircle, Shield,
  CreditCard, Lock, AlertCircle, MapPin, Calendar, Users, Loader2,
} from "lucide-react";
import type { Route } from "./+types/book.$id";
import { Navbar } from "../components/Navbar";
import axiosInstance from "../axios";
import { getCurrentUser } from "../axios";
import type { ApiSpace } from "../lib/api-types";
import { getSpaceImage } from "../lib/api-types";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Book — Monet` },
    { name: "description", content: "Confirm your coworking space booking." },
  ];
}

type PriceMode = "hour" | "day";

/* ─── Success Screen ─────────────────────────────────────────────────────── */
function SuccessScreen({ spaceName, date, reservationId }: { spaceName: string; date: string; reservationId: number }) {
  const code = String(reservationId).padStart(6, "0");
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f8f6f2" }}>
      <div className="max-w-md w-full text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-[28px] font-extrabold text-zinc-950 mb-2 tracking-tight">You're booked!</h1>
        <p className="text-zinc-500 text-[15px] leading-relaxed mb-8">
          Your access code for <span className="font-semibold text-zinc-800">{spaceName}</span> on{" "}
          <span className="font-semibold text-zinc-800">{date || "your selected date"}</span> is ready.
        </p>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-8 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Your access code</p>
          <p className="font-mono text-[36px] font-bold tracking-[0.18em] text-zinc-950">{code}</p>
          <p className="text-[12px] text-zinc-400 mt-2">Valid on your booking date. Show at reception or enter on the keypad.</p>
        </div>
        <p className="text-[12px] text-zinc-400 mb-4">Booking #{reservationId} confirmed. Check My Bookings for details.</p>
        <div className="flex gap-3">
          <Link to="/mybookings"
            className="flex-1 rounded-xl bg-zinc-950 py-3 text-[13.5px] font-bold text-white hover:bg-zinc-800 transition-all text-center">
            My Bookings
          </Link>
          <Link to="/search"
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-[13.5px] font-bold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-center">
            Browse more
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Book Page ──────────────────────────────────────────────────────────── */
export default function BookSpace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [space, setSpace] = useState<ApiSpace | null>(null);
  const [loadingSpace, setLoadingSpace] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);
  const dateParam  = searchParams.get("date")  ?? "";
  const desksParam = Number(searchParams.get("desks") ?? "1");
  const modeParam  = (searchParams.get("mode") ?? "day") as PriceMode;
  const startParam = searchParams.get("start") ?? "";
  const endParam   = searchParams.get("end")   ?? "";

  const [step, setStep]       = useState<"details" | "payment" | "success">("details");
  const [date, setDate]       = useState(dateParam || todayStr);
  const [desks, setDesks]     = useState(desksParam > 0 ? desksParam : 1);
  const [priceMode]           = useState<PriceMode>(modeParam);
  const [startTime, setStartTime] = useState(startParam || `${dateParam || todayStr}T09:00:00`);
  const [endTime, setEndTime]     = useState(endParam   || `${dateParam || todayStr}T17:00:00`);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);

  // Guest details (pre-fill from localStorage)
  const currentUser = getCurrentUser();
  const [firstName, setFirstName] = useState(String(currentUser?.fname ?? ""));
  const [lastName,  setLastName]  = useState(String(currentUser?.surname ?? ""));
  const [email,     setEmail]     = useState(String(currentUser?.email ?? ""));
  const [phone,     setPhone]     = useState(String(currentUser?.phone_number ?? ""));
  const [notes,     setNotes]     = useState("");

  // Payment (cosmetic — real payment not in scope)
  const [cardNum,  setCardNum]  = useState("");
  const [expiry,   setExpiry]   = useState("");
  const [cvc,      setCvc]      = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoadingSpace(true);
    axiosInstance.get(`/spaces/${id}`)
      .then(res => setSpace(res.data.data))
      .catch(() => setSpace(null))
      .finally(() => setLoadingSpace(false));
  }, [id]);

  // Auth guard
  useEffect(() => {
    if (!getCurrentUser()) {
      navigate(`/login?redirect=/book/${id}`);
    }
  }, [id, navigate]);

  if (loadingSpace) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f6f2" }}>
        <Loader2 className="h-9 w-9 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "#f8f6f2" }}>
        <p className="text-zinc-500 font-medium">Space not found.</p>
        <Link to="/search" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white">Browse spaces</Link>
      </div>
    );
  }

  if (step === "success" && reservationId) {
    return <SuccessScreen spaceName={space.space_name} date={date} reservationId={reservationId} />;
  }

  const price      = priceMode === "hour" ? space.price_per_hour : space.price_per_day;
  const label      = priceMode === "hour" ? "hr" : "day";
  const subtotal   = price * desks;
  const serviceFee = Math.round(subtotal * 0.08);
  const total      = subtotal + serviceFee;
  const img        = getSpaceImage(space);

  const formatCard   = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const bookingDate = date || new Date().toISOString().slice(0, 10);
      let start = startTime;
      let end   = endTime;

      if (priceMode === "day") {
        start = `${bookingDate}T09:00:00`;
        end   = `${bookingDate}T18:00:00`;
      } else {
        if (!start || start.startsWith("T") || !start.includes("T")) {
          start = `${bookingDate}T09:00:00`;
        }
        if (!end || end.startsWith("T") || !end.includes("T")) {
          end = `${bookingDate}T17:00:00`;
        }
      }

      const res = await axiosInstance.post("/spaces/reservations", {
        space_id: space.space_id,
        reservation_type: desks > 1 ? "group" : "individual",
        guest_count: desks,
        start_time: start,
        end_time: end,
      });

      setReservationId(res.data.data.reservation_id);
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message ?? "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[13.5px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";

  return (
    <div className="min-h-screen" style={{ background: "#f8f6f2" }}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 pb-28">

        {/* Back */}
        <button type="button" onClick={() => step === "payment" ? setStep("details") : navigate(`/space/${space.space_id}`)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors mb-7">
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          {step === "payment" ? "Back to details" : "Back to space"}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {(["details", "payment"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-all ${step === s || (s === "details" && step === "payment") ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500"}`}>
                {s === "details" && step === "payment" ? <CheckCircle className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </div>
              <span className={`text-[13px] font-semibold ${step === s ? "text-zinc-900" : "text-zinc-400"}`}>
                {s === "details" ? "Your details" : "Payment"}
              </span>
              {i === 0 && <div className="w-8 h-px bg-zinc-300 mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Form */}
          <div>
            <AnimatePresence mode="wait">
              {step === "details" && (
                <motion.form key="details" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}
                  onSubmit={handleDetailsNext} className="space-y-6">
                  <div className="bg-white rounded-2xl border border-zinc-200/70 p-6">
                    <h2 className="font-display text-[18px] font-bold text-zinc-950 mb-5">Your details</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">First name</label>
                        <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Max" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Last name</label>
                        <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className={inputCls} />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Email</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="max@example.com" className={inputCls} />
                    </div>
                    <div className="mb-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Phone</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+37120000000" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Notes (optional)</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any special requirements..." className={`${inputCls} resize-none`} />
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full rounded-xl bg-blue-600 py-4 text-[14px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25">
                    Continue to payment →
                  </button>
                </motion.form>
              )}

              {step === "payment" && (
                <motion.form key="payment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.25 }}
                  onSubmit={handlePay} className="space-y-6">
                  <div className="bg-white rounded-2xl border border-zinc-200/70 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display text-[18px] font-bold text-zinc-950">Payment</h2>
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
                        <Lock className="h-3.5 w-3.5" strokeWidth={2.5} /> Secure checkout
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" strokeWidth={2} />
                        <p className="text-[13px] text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Card number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                        <input required value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" className={`${inputCls} pl-10`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Expiry</label>
                        <input required value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">CVC</label>
                        <input required value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Name on card</label>
                      <input required value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Max Smith" className={inputCls} />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} id="pay-btn"
                    className="w-full rounded-xl bg-blue-600 py-4 text-[14px] font-bold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</> : <>Confirm & Pay €{total}</>}
                  </button>

                  <p className="text-center text-[12px] text-zinc-400">
                    <Shield className="h-3.5 w-3.5 inline mr-1" strokeWidth={1.75} />
                    Your card details are encrypted and secure.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Summary sidebar */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-sm overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img src={img} alt={space.space_name} className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"; }}
                />
              </div>
              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{space.city}</p>
                <h3 className="font-bold text-[16px] text-zinc-950 mb-1">{space.space_name}</h3>
                <div className="flex items-center gap-1 text-[12.5px] text-zinc-500 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                  {space.address}
                </div>
                <div className="space-y-2.5 text-[13px] border-t border-zinc-100 pt-4">
                  <div className="flex justify-between text-zinc-600">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />{date || "Selected date"}</span>
                    <span className="font-medium">{priceMode === "hour" ? "Hourly" : "Day pass"}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />{desks} desk{desks > 1 ? "s" : ""}</span>
                  </div>
                  <div className="border-t border-zinc-100 pt-2.5 space-y-2">
                    <div className="flex justify-between text-zinc-600"><span>€{price} × {desks}</span><span className="tabular-nums">€{subtotal}</span></div>
                    <div className="flex justify-between text-zinc-600"><span>Service fee (8%)</span><span className="tabular-nums">€{serviceFee}</span></div>
                    <div className="flex justify-between font-bold text-zinc-900 text-[15px] pt-2 border-t border-zinc-100"><span>Total</span><span className="tabular-nums">€{total}</span></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[12px] text-emerald-600 font-semibold">
                  <CheckCircle className="h-4 w-4" strokeWidth={2} /> Free cancellation before check-in
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}