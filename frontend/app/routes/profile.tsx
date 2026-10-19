import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Heart,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  KeyRound,
  BadgeCheck,
} from "lucide-react";
import type { Route } from "./+types/profile";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import axiosInstance, { getCurrentUser, saveSession } from "../axios";
import { useFavorites } from "../lib/favorites";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Account Settings — Monet" },
    { name: "description", content: "Manage your profile, personal details, and account security." },
  ];
}

interface UserProfileData {
  user_id: number;
  username: string;
  fname: string;
  surname: string;
  email: string;
  phone_number: string;
  role_id: number;
  role_name?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { count: favoritesCount } = useFavorites();

  const [activeTab, setActiveTab] = useState<"general" | "security">("general");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // Form states for general info
  const [fname, setFname] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form states for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch initial profile
  useEffect(() => {
    const localUser = getCurrentUser();
    if (!localUser) {
      navigate("/login");
      return;
    }

    async function loadProfile() {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/auth/me");
        if (res.data?.user) {
          const u: UserProfileData = res.data.user;
          setProfile(u);
          setFname(u.fname || "");
          setSurname(u.surname || "");
          setUsername(u.username || "");
          setEmail(u.email || "");
          setPhone(u.phone_number || "");
        }
      } catch (err: any) {
        // Fallback to local session if network or offline
        if (localUser) {
          const u = localUser as unknown as UserProfileData;
          setProfile(u);
          setFname(u.fname || "");
          setSurname(u.surname || "");
          setUsername(u.username || "");
          setEmail(u.email || "");
          setPhone(u.phone_number || "");
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fname.trim() || !surname.trim() || !username.trim() || !email.trim() || !phone.trim()) {
      setProfileError("Please fill in all profile fields.");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await axiosInstance.put("/auth/profile", {
        fname: fname.trim(),
        surname: surname.trim(),
        username: username.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
      });

      if (res.data?.success && res.data?.user) {
        const updated = res.data.user;
        setProfile(updated);
        // Save session and notify other components
        saveSession(res.data.token, updated);
        window.dispatchEvent(new Event("monet:user:updated"));

        setProfileSuccess("Profile details updated successfully.");
        setTimeout(() => setProfileSuccess(null), 4000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError("New password must contain both letters and at least one number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await axiosInstance.put("/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.data?.success) {
        setPasswordSuccess("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(null), 4000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password. Please verify current password.";
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "October 2026";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-zinc-100 rounded-full blur-2xl pointer-events-none opacity-60" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              {/* Initials Avatar */}
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-700 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white ring-1 ring-zinc-200/60 flex-shrink-0">
                {profile?.fname?.[0]?.toUpperCase() || "U"}
                {profile?.surname?.[0]?.toUpperCase() || ""}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                    {profile?.fname} {profile?.surname}
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-200">
                    <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
                    {profile?.role_name === "admin"
                      ? "Administrator"
                      : profile?.role_name === "landlord"
                      ? "Host / Landlord"
                      : "Verified Member"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1.5 flex-wrap">
                  <span className="font-mono text-zinc-600">@{profile?.username}</span>
                  <span>•</span>
                  <span>Member since {memberSince}</span>
                  <span>•</span>
                  <span className="text-zinc-600 font-mono">ID: #{profile?.user_id || 1}</span>
                </div>
              </div>
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                to="/mybookings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition"
              >
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Bookings
              </Link>
              <Link
                to="/saved"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition"
              >
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                Saved ({favoritesCount})
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 border-b border-zinc-200/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "general"
                ? "bg-zinc-950 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <User className="h-4 w-4" />
            Personal Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "security"
                ? "bg-zinc-950 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Shield className="h-4 w-4" />
            Security & Password
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
            <p className="text-xs text-zinc-400 font-medium">Loading profile information...</p>
          </div>
        )}

        {/* Tab Content: Personal Info */}
        {!loading && activeTab === "general" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Left: General Info Form */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-zinc-950">Personal Information</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update your contact details and how other members identify you.
                </p>
              </div>

              {/* Success Banner */}
              <AnimatePresence>
                {profileSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>{profileSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Banner */}
              <AnimatePresence>
                {profileError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                    <span>{profileError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      placeholder="e.g. Max"
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium transition"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="e.g. Uttko"
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium transition"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-9 pr-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium font-mono transition"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    Unique handle for your public profile and workspace check-ins.
                  </p>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium transition"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+371 20 000 000"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium font-mono transition"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    Used for SMS door pass notifications and host verification.
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Security & Membership Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-950">Account Security</h3>
                    <p className="text-[11px] text-zinc-400">Status & Protection</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                    <span className="text-zinc-500">Password</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("security")}
                      className="font-bold text-blue-600 hover:text-blue-700"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                    <span className="text-zinc-500">2-Factor Authentication</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Enabled (SMS)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500">Account Type</span>
                    <span className="font-bold text-zinc-900 capitalize">
                      {profile?.role_name || "Member"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Perks / Info */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-zinc-300">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Monet Pass Active</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Enjoy seamless keyless smart locks, high-speed fiber WiFi, and priority coworking booking in Riga.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Content: Security & Password */}
        {!loading && activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-zinc-950">Change Password</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Ensure your account is protected with a secure and unique passphrase.
              </p>
            </div>

            {/* Success Banner */}
            <AnimatePresence>
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner */}
            <AnimatePresence>
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5"
                >
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{passwordError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters with letters & numbers"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Must be between 8 and 50 characters, containing letters and at least one number.
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-sm font-medium transition"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
