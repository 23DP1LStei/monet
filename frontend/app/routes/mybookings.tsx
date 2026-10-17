import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Calendar, MapPin, Users, Star, X, Check,
  AlertCircle, CheckCircle, Ban, ArrowRight, Loader2, Copy, Wifi,
  Phone, Mail, MessageCircle
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import axiosInstance, { getCurrentUser } from "../axios";
import type { ApiReservation } from "../lib/api-types";
import { SPACE_TYPE_LABELS } from "../lib/api-types";
import ball from "../images/ball.svg";
import ball_grey from "../images/ball_grey.svg";
import person from "../images/person.svg";
import locationSvg from "../images/location.svg";
import calendarSvg from "../images/calendar.svg";
import keySvg from "../images/key.svg";

type FilterTab = "all" | "active" | "upcoming" | "past";

function parseBookingDates(startStr: string, endStr: string) {
  const safeStart = startStr ? startStr.replace(" ", "T") : "";
  const safeEnd = endStr ? endStr.replace(" ", "T") : "";
  const s = new Date(safeStart);
  const e = new Date(safeEnd);

  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    return {
      dateFormatted: startStr?.slice(0, 10) || "N/A",
      timeFormatted: `${startStr?.slice(11, 16) || "09:00"} — ${endStr?.slice(11, 16) || "18:00"}`,
      isToday: false,
      isPast: false,
      isUpcoming: false,
    };
  }

  const now = new Date();
  const isToday = s.toDateString() === now.toDateString();
  const isPast = e < now;
  const isUpcoming = s > now && !isToday;

  const dateFormatted = s.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const startTimeStr = s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const endTimeStr = e.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const diffHours = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60)));

  return {
    dateFormatted,
    timeFormatted: `${startTimeStr} — ${endTimeStr} (${diffHours} ${diffHours === 1 ? "Hour" : "Hours"})`,
    isToday,
    isPast,
    isUpcoming,
  };
}

/* ─── Door Code & Key Modal ──────────────────────────────────────────────── */
function DoorCodeModal({
  reservation,
  onClose,
}: {
  reservation: ApiReservation;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const code = String(reservation.reservation_id).padStart(6, "0");
  const { dateFormatted, timeFormatted } = parseBookingDates(
    reservation.start_time,
    reservation.end_time
  );

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-zinc-100"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-amber-400 shadow-md">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-950 leading-tight">
              Door Code & Key
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {reservation.space?.space_name}
            </p>
          </div>
        </div>

        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-6 text-center mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
            Keypad Access PIN
          </p>
          <p className="font-mono text-4xl font-extrabold tracking-[0.2em] text-zinc-950 mb-3">
            {code}
          </p>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Code
              </>
            )}
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-600 border-t border-zinc-100 pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-medium">Date</span>
            <span className="font-semibold text-zinc-800">{dateFormatted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-medium">Time Window</span>
            <span className="font-semibold text-zinc-800">{timeFormatted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-medium flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5 text-zinc-400" /> Wi-Fi Network
            </span>
            <span className="font-semibold text-zinc-800">Monet-HighSpeed</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 font-medium">Wi-Fi Password</span>
            <span className="font-mono font-semibold text-zinc-800">
              monet2026pass
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-zinc-950 text-white font-bold text-sm hover:bg-zinc-800 transition"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Review Modal ────────────────────────────────────────────────────────── */
function ReviewModal({
  reservation,
  onClose,
  onSuccess,
}: {
  reservation: ApiReservation;
  onClose: () => void;
  onSuccess: (reservationId: number) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await axiosInstance.post("/spaces/reviews", {
        reservation_id: reservation.reservation_id,
        rating,
        comment: comment.trim(),
      });
      onSuccess(reservation.reservation_id);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-zinc-100"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold text-zinc-950 mb-1">Leave a Review</h3>
        <p className="text-xs text-zinc-500 mb-6">
          How was your experience at {reservation.space?.space_name}?
        </p>

        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-zinc-200"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-zinc-800">
                {rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others what you loved about the desk, internet speed, or atmosphere..."
              className="w-full rounded-2xl border border-zinc-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none transition"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Post Review"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Contact Host Modal ──────────────────────────────────────────────────── */
function ContactHostModal({
  reservation,
  onClose,
}: {
  reservation: ApiReservation;
  onClose: () => void;
}) {
  const host = reservation.space?.host || {
    name: "Anna Bērziņa",
    email: "anna@spaces.lv",
    phone: "+371 20 000 002",
  };

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1800);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-zinc-100"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Host Profile Info */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
            {host.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold text-zinc-950 leading-tight">
                {host.name}
              </h3>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Host at {reservation.space?.space_name}
            </p>
          </div>
        </div>

        {/* Direct Channels */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <a
            href={`tel:${host.phone}`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 p-3 text-xs font-bold text-zinc-800 transition"
          >
            <Phone className="h-4 w-4 text-emerald-600" />
            <span>Call Host</span>
          </a>
          <a
            href={`mailto:${host.email}?subject=Monet%20Booking%20%23RES-${reservation.reservation_id}%20Question`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 p-3 text-xs font-bold text-zinc-800 transition"
          >
            <Mail className="h-4 w-4 text-blue-600" />
            <span>Send Email</span>
          </a>
        </div>

        {/* Contact details card */}
        <div className="bg-zinc-50 rounded-2xl border border-zinc-200/80 p-4 mb-6 space-y-2 text-xs">
          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-zinc-400 font-medium">Direct Phone</span>
            <span className="font-semibold text-zinc-900">{host.phone}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-zinc-400 font-medium">Direct Email</span>
            <span className="font-semibold text-zinc-900">{host.email}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-600">
            <span className="text-zinc-400 font-medium">Reception Desk</span>
            <span className="font-semibold text-zinc-900">08:00 — 19:00</span>
          </div>
        </div>

        {/* Quick Message Form */}
        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-emerald-800">Message sent to {host.name}!</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">The host will reply shortly via SMS or email.</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Quick message to host
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Hi Anna, where is the best place to park tomorrow?"
              className="w-full rounded-2xl border border-zinc-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none transition"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full py-3 rounded-2xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Main My Bookings Page ──────────────────────────────────────────────── */
export default function MyBookings() {
  const navigate = useNavigate();
  const [bookingFilter, setBookingFilter] = useState<FilterTab>("all");
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoorModal, setActiveDoorModal] = useState<ApiReservation | null>(null);
  const [activeContactModal, setActiveContactModal] = useState<ApiReservation | null>(null);
  const [activeReviewModal, setActiveReviewModal] = useState<ApiReservation | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  // Auth guard & Fetch reservations
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login?redirect=/mybookings");
      return;
    }

    setLoading(true);
    axiosInstance
      .get("/spaces/reservations/my")
      .then((res) => {
        setReservations(res.data.data ?? []);
      })
      .catch((err) => {
        console.error("Failed to load reservations:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleCancelReservation = async (reservationId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelingId(reservationId);

    try {
      await axiosInstance.patch(`/spaces/reservations/${reservationId}/cancel`);
      setReservations((prev) =>
        prev.map((r) =>
          r.reservation_id === reservationId
            ? { ...r, reservation_status: "canceled" }
            : r
        )
      );
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      alert(apiErr.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancelingId(null);
    }
  };

  const handleReviewSuccess = (reservationId: number) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.reservation_id === reservationId ? { ...r, has_review: true } : r
      )
    );
  };

  // Filter tabs logic
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const { isToday, isUpcoming, isPast } = parseBookingDates(
        r.start_time,
        r.end_time
      );

      if (bookingFilter === "active") {
        return r.reservation_status === "confirmed" && isToday;
      }
      if (bookingFilter === "upcoming") {
        return r.reservation_status === "confirmed" && isUpcoming;
      }
      if (bookingFilter === "past") {
        return r.reservation_status === "canceled" || isPast;
      }
      return true; // "all"
    });
  }, [reservations, bookingFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let past = 0;

    reservations.forEach((r) => {
      const { isToday, isUpcoming, isPast } = parseBookingDates(
        r.start_time,
        r.end_time
      );
      if (r.reservation_status === "confirmed" && isToday) active++;
      if (r.reservation_status === "confirmed" && isUpcoming) upcoming++;
      if (r.reservation_status === "canceled" || isPast) past++;
    });

    return { all: reservations.length, active, upcoming, past };
  }, [reservations]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-zinc-900">
      <Navbar />

      <AnimatePresence>
        {activeDoorModal && (
          <DoorCodeModal
            reservation={activeDoorModal}
            onClose={() => setActiveDoorModal(null)}
          />
        )}
        {activeContactModal && (
          <ContactHostModal
            reservation={activeContactModal}
            onClose={() => setActiveContactModal(null)}
          />
        )}
        {activeReviewModal && (
          <ReviewModal
            reservation={activeReviewModal}
            onClose={() => setActiveReviewModal(null)}
            onSuccess={handleReviewSuccess}
          />
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-zinc-200/60">
          <div>
            <h6 className="text-[11px] font-bold text-[#A1A1AA] mb-1.5 tracking-[1.2px] uppercase">
              MEMBER PORTAL
            </h6>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight">
              My Bookings
            </h1>
            <p className="text-sm text-[#71717A] mt-1">
              Manage your active passes, door codes, and past workspace visits.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center rounded-xl bg-white border border-zinc-200/80 p-1 shadow-sm text-[12px] font-semibold self-start sm:self-end">
            {(["all", "active", "upcoming", "past"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                id={`booking-${filter}`}
                aria-pressed={bookingFilter === filter}
                onClick={() => setBookingFilter(filter)}
                className={`rounded-[10px] px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5 ${
                  bookingFilter === filter
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span>
                  {filter === "all"
                    ? "All"
                    : filter === "active"
                    ? "Active"
                    : filter === "upcoming"
                    ? "Upcoming"
                    : "Past"}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    bookingFilter === filter
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {counts[filter]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-xs font-medium text-zinc-400">Loading your reservations...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredReservations.length === 0 && (
          <div className="bg-white rounded-3xl border border-zinc-200/80 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Calendar className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-zinc-950 mb-1">
              No bookings found
            </h3>
            <p className="text-xs text-zinc-500 mb-6 max-w-xs mx-auto">
              {bookingFilter === "all"
                ? "You haven't made any coworking reservations yet."
                : `You don't have any ${bookingFilter} bookings right now.`}
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm shadow-blue-600/25"
            >
              Browse Coworking Spaces <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Booking Cards List */}
        {!loading && filteredReservations.length > 0 && (
          <div className="flex flex-col gap-5">
            {filteredReservations.map((r) => {
              const { dateFormatted, timeFormatted, isToday, isPast, isUpcoming } =
                parseBookingDates(r.start_time, r.end_time);

              const isCanceled = r.reservation_status === "canceled";
              const isConfirmed = r.reservation_status === "confirmed";

              return (
                <div
                  key={r.reservation_id}
                  className="flex flex-col md:flex-row justify-between bg-white w-full p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow gap-6"
                >
                  {/* Left Column: Details */}
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    {/* Status & Type Pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      {isCanceled ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-3xl px-3 py-1 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          <p className="text-rose-700 text-[11px] font-bold">
                            Canceled
                          </p>
                        </div>
                      ) : isToday ? (
                        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl px-3 py-1 flex items-center gap-1.5">
                          <img src={ball} alt="active" className="w-2.5 h-2.5" />
                          <p className="text-[#047857] text-[11px] font-bold">
                            Active Today
                          </p>
                        </div>
                      ) : isUpcoming ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-3xl px-3 py-1 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          <p className="text-blue-700 text-[11px] font-bold">
                            Upcoming
                          </p>
                        </div>
                      ) : (
                        <div className="bg-zinc-100 border border-zinc-200 rounded-3xl px-3 py-1 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-zinc-400" />
                          <p className="text-zinc-600 text-[11px] font-bold">
                            Completed
                          </p>
                        </div>
                      )}

                      {/* Space type pill */}
                      <div className="bg-[#F4F4F5] border border-[#E4E4E7] rounded-3xl px-3 py-1">
                        <p className="text-center text-[11px] font-semibold text-zinc-700">
                          {SPACE_TYPE_LABELS[
                            (r.space as unknown as { space_type?: string })?.space_type ||
                              "hot-desk"
                          ] || "Hot Desk"}
                        </p>
                      </div>

                      {/* Guest info & ID */}
                      <div className="flex items-center text-[11px] text-[#A1A1AA] font-medium ml-1">
                        <img src={person} alt="guests" className="w-3.5 h-3.5 inline mr-1" />
                        <span>
                          {r.guest_count} Guest{r.guest_count > 1 ? "s" : ""}
                        </span>
                        <span className="font-mono text-[#A1A1AA] ml-3">
                          ID: #RES-{String(r.reservation_id).padStart(5, "0")}
                        </span>
                      </div>
                    </div>

                    {/* Space Name & Location */}
                    <div className="flex flex-col gap-0.5">
                      <Link
                        to={`/space/${r.space?.space_id}`}
                        className="text-xl font-bold text-zinc-950 hover:text-blue-600 transition truncate"
                      >
                        {r.space?.space_name || "Coworking Space"}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                        <img src={locationSvg} alt="location" className="w-3.5 h-3.5 shrink-0" />
                        <p className="truncate">
                          {r.space?.address}
                          {r.space?.city ? `, ${r.space.city}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Date & Time info */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#52525B]">
                      <div className="flex items-center gap-1.5">
                        <img src={calendarSvg} alt="date" className="w-3.5 h-3.5 shrink-0" />
                        <p className="font-medium text-[#52525B]">
                          {dateFormatted}
                        </p>
                      </div>
                      <img src={ball_grey} className="w-1 h-1 hidden sm:block" alt="separator" />
                      <p className="font-mono text-zinc-600">{timeFormatted}</p>
                    </div>
                  </div>

                  {/* Right Column: Pricing & Action Buttons */}
                  <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 gap-3">
                    <div className="md:text-right">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-[#A1A1AA]">
                        Total Paid
                      </p>
                      <h4 className="font-bold text-2xl text-zinc-950 tabular-nums">
                        €{r.amount}.00
                      </h4>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Contact Host Button */}
                      <button
                        type="button"
                        onClick={() => setActiveContactModal(r)}
                        className="border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs px-3.5 py-2.5 rounded-3xl transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Contact Host</span>
                      </button>

                      {/* Door Code Button */}
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => setActiveDoorModal(r)}
                          className="bg-[#09090B] hover:bg-zinc-800 text-white font-bold text-xs px-4 py-2.5 rounded-3xl flex items-center gap-2 transition active:scale-95 shadow-sm"
                        >
                          <img src={keySvg} alt="key" className="w-3.5 h-3.5" />
                          <span>Door Code & Key</span>
                        </button>
                      )}

                      {/* Cancel Button */}
                      {isConfirmed && (isUpcoming || isToday) && (
                        <button
                          type="button"
                          disabled={cancelingId === r.reservation_id}
                          onClick={() => handleCancelReservation(r.reservation_id)}
                          className="border border-zinc-200 hover:border-red-300 hover:bg-red-50 text-zinc-600 hover:text-red-600 font-semibold text-xs px-3.5 py-2.5 rounded-3xl transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          {cancelingId === r.reservation_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                          <span>Cancel</span>
                        </button>
                      )}

                      {/* Review Button */}
                      {isConfirmed && isPast && !r.has_review && (
                        <button
                          type="button"
                          onClick={() => setActiveReviewModal(r)}
                          className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs px-3.5 py-2.5 rounded-3xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                          <span>Leave Review</span>
                        </button>
                      )}

                      {/* Already Reviewed indicator */}
                      {r.has_review && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl">
                          <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}