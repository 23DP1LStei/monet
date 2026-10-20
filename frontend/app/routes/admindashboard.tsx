import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  MapPin,
  X,
  Search,
  Mail,
  Phone,
  RefreshCw,
  ExternalLink,
  Check,
} from "lucide-react";
import type { Route } from "./+types/admindashboard";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import axiosInstance, { getCurrentUser } from "../axios";
import { AmenitySelector } from "../components/AmenityItem";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Host Admin Panel — Monet" },
    { name: "description", content: "Manage your registered coworking spaces and review incoming resident reservations." },
  ];
}

interface AdminStats {
  total_users: number;
  total_spaces: number;
  active_spaces: number;
  total_spots: number;
  total_reservations: number;
  confirmed_reservations: number;
  pending_requests: number;
  total_revenue: string;
}

interface AdminUser {
  user_id: number;
  username: string;
  fname: string;
  surname: string;
  email: string;
  phone_number: string;
  role_id: number;
  role_name: "guest" | "user" | "landlord" | "admin" | string;
  created_at: string;
  total_reservations?: number;
  total_spaces?: number;
}

interface ManagedSpace {
  space_id: number;
  creator_id: number;
  space_name: string;
  city: string;
  address: string;
  space_type: string;
  space_description?: string;
  available_spots: number;
  price_per_hour: number;
  price_per_day: number;
  is_instant_book: boolean | number;
  is_active: number;
  amenities?: string[];
  created_at: string;
  creator_fname?: string;
  creator_surname?: string;
  creator_email?: string;
  total_bookings?: number;
  pending_bookings?: number;
}

interface ManagedReservation {
  reservation_id: number;
  space_id: number;
  user_id: number;
  reservation_type: string;
  guest_count: number;
  amount: number;
  start_time: string;
  end_time: string;
  reservation_status: "pending" | "confirmed" | "canceled";
  created_at: string;
  space_name: string;
  address: string;
  city: string;
  fname: string;
  surname: string;
  email: string;
  phone_number: string;
  username: string;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"spaces" | "requests" | "users">("spaces");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [spacesFilter, setSpacesFilter] = useState<"all" | "active" | "paused">("all");
  const [resFilter, setResFilter] = useState<"all" | "pending" | "confirmed" | "canceled">("all");
  const [usersFilter, setUsersFilter] = useState<"all" | "admin" | "landlord" | "user">("all");

  // Data states
  const [spaces, setSpaces] = useState<ManagedSpace[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reservations, setReservations] = useState<ManagedReservation[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_spaces: 0,
    active_spaces: 0,
    total_spots: 0,
    total_reservations: 0,
    confirmed_reservations: 0,
    pending_requests: 0,
    total_revenue: "0.00",
  });

  // Action / Feedback states
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Space Modals
  const [addSpaceModalOpen, setAddSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ManagedSpace | null>(null);
  const [deletingSpace, setDeletingSpace] = useState<ManagedSpace | null>(null);

  // Space Form Inputs
  const [spaceName, setSpaceName] = useState("");
  const [spaceAddress, setSpaceAddress] = useState("");
  const [spaceCity, setSpaceCity] = useState("Riga");
  const [spaceType, setSpaceType] = useState("hot-desk");
  const [spaceSpots, setSpaceSpots] = useState(10);
  const [spacePriceHour, setSpacePriceHour] = useState(5.0);
  const [spacePriceDay, setSpacePriceDay] = useState(25.0);
  const [spaceDescription, setSpaceDescription] = useState("");
  const [spaceIsActive, setSpaceIsActive] = useState(true);
  const [spaceAmenities, setSpaceAmenities] = useState<string[]>(["wifi", "coffee", "24/7", "chair"]);

  // User Modals
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  // User Form Inputs
  const [userFname, setUserFname] = useState("");
  const [userSurname, setUserSurname] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userRole, setUserRole] = useState("user");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const isAdmin = currentUser?.role_name === "admin";

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async (userObj?: any) => {
    try {
      setLoading(true);
      const activeUser = userObj || currentUser || getCurrentUser();
      const adminRole = activeUser?.role_name === "admin";

      if (adminRole) {
        const [statsRes, spacesRes, usersRes, resRes] = await Promise.all([
          axiosInstance.get("/admin/stats"),
          axiosInstance.get("/admin/spaces"),
          axiosInstance.get("/admin/users"),
          axiosInstance.get("/admin/reservations"),
        ]);

        if (statsRes.data?.success && statsRes.data.stats) {
          setStats(statsRes.data.stats);
        }
        if (spacesRes.data?.success) {
          setSpaces(spacesRes.data.data || []);
        }
        if (usersRes.data?.success) {
          setUsers(usersRes.data.data || []);
        }
        if (resRes.data?.success) {
          setReservations(resRes.data.data || []);
        }
      } else {
        // Landlord or Host view
        const [spacesRes, resRes] = await Promise.all([
          axiosInstance.get("/spaces/managed"),
          axiosInstance.get("/spaces/managed/reservations"),
        ]);

        const managedSpaces = spacesRes.data?.data || [];
        const managedReservations = resRes.data?.data || [];
        setSpaces(managedSpaces);
        setReservations(managedReservations);

        const activeSpacesCount = managedSpaces.filter((s: ManagedSpace) => s.is_active === 1).length;
        const totalSpotsCount = managedSpaces.reduce((acc: number, s: ManagedSpace) => acc + (Number(s.available_spots) || 0), 0);
        const pendingCount = managedReservations.filter((r: ManagedReservation) => r.reservation_status === "pending").length;
        const confirmedRevenue = managedReservations
          .filter((r: ManagedReservation) => r.reservation_status === "confirmed")
          .reduce((acc: number, r: ManagedReservation) => acc + (Number(r.amount) || 0), 0)
          .toFixed(2);

        setStats({
          total_users: 1,
          total_spaces: managedSpaces.length,
          active_spaces: activeSpacesCount,
          total_spots: totalSpotsCount,
          total_reservations: managedReservations.length,
          confirmed_reservations: managedReservations.filter((r: ManagedReservation) => r.reservation_status === "confirmed").length,
          pending_requests: pendingCount,
          total_revenue: confirmedRevenue,
        });
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      showNotification("error", err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);
    if (user.role_name !== "admin" && activeTab === "users") {
      setActiveTab("spaces");
    }
    fetchData(user);
  }, [navigate]);

  // Space Handlers
  const openAddSpaceModal = () => {
    setSpaceName("");
    setSpaceAddress("");
    setSpaceCity("Riga");
    setSpaceType("hot-desk");
    setSpaceSpots(12);
    setSpacePriceHour(5.0);
    setSpacePriceDay(25.0);
    setSpaceDescription("");
    setSpaceIsActive(true);
    setSpaceAmenities(["wifi", "coffee", "24/7", "chair"]);
    setAddSpaceModalOpen(true);
  };

  const openEditSpaceModal = (sp: ManagedSpace) => {
    setEditingSpace(sp);
    setSpaceName(sp.space_name);
    setSpaceAddress(sp.address);
    setSpaceCity(sp.city || "Riga");
    setSpaceType(sp.space_type || "hot-desk");
    setSpaceSpots(sp.available_spots);
    setSpacePriceHour(Number(sp.price_per_hour));
    setSpacePriceDay(Number(sp.price_per_day));
    setSpaceDescription(sp.space_description || "");
    setSpaceIsActive(sp.is_active === 1);
    setSpaceAmenities(Array.isArray(sp.amenities) ? sp.amenities : []);
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const endpoint = isAdmin ? "/admin/spaces" : "/spaces/managed";
      const res = await axiosInstance.post(endpoint, {
        space_name: spaceName,
        address: spaceAddress,
        city: spaceCity,
        space_type: spaceType,
        available_spots: spaceSpots,
        price_per_hour: spacePriceHour,
        price_per_day: spacePriceDay,
        space_description: spaceDescription,
        is_active: spaceIsActive ? 1 : 0,
        amenities: spaceAmenities,
      });

      if (res.data?.success) {
        showNotification("success", "Space created successfully!");
        setAddSpaceModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to create space.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpace) return;
    try {
      setActionLoading(true);
      const endpoint = isAdmin ? `/admin/spaces/${editingSpace.space_id}` : `/spaces/managed/${editingSpace.space_id}`;
      const res = await axiosInstance.put(endpoint, {
        space_name: spaceName,
        address: spaceAddress,
        city: spaceCity,
        space_type: spaceType,
        available_spots: spaceSpots,
        price_per_hour: spacePriceHour,
        price_per_day: spacePriceDay,
        space_description: spaceDescription,
        is_active: spaceIsActive ? 1 : 0,
        amenities: spaceAmenities,
      });

      if (res.data?.success) {
        showNotification("success", "Space updated successfully!");
        setEditingSpace(null);
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to update space.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSpaceActive = async (sp: ManagedSpace) => {
    try {
      const newActive = sp.is_active ? 0 : 1;
      const endpoint = isAdmin ? `/admin/spaces/${sp.space_id}` : `/spaces/managed/${sp.space_id}`;
      const res = await axiosInstance.put(endpoint, {
        is_active: newActive,
      });
      if (res.data?.success) {
        showNotification(
          "success",
          `"${sp.space_name}" is now ${newActive ? "Active" : "Paused"}.`
        );
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleDeleteSpace = async () => {
    if (!deletingSpace) return;
    try {
      setActionLoading(true);
      const endpoint = isAdmin ? `/admin/spaces/${deletingSpace.space_id}` : `/spaces/managed/${deletingSpace.space_id}`;
      const res = await axiosInstance.delete(endpoint);
      if (res.data?.success) {
        showNotification("success", "Space removed.");
        setDeletingSpace(null);
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to delete space.");
    } finally {
      setActionLoading(false);
    }
  };

  // User Handlers
  const openEditUserModal = (u: AdminUser) => {
    setEditingUser(u);
    setUserFname(u.fname);
    setUserSurname(u.surname);
    setUserUsername(u.username);
    setUserEmail(u.email);
    setUserPhone(u.phone_number);
    setUserRole(u.role_name.toLowerCase());
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setActionLoading(true);
      const res = await axiosInstance.put(`/admin/users/${editingUser.user_id}`, {
        fname: userFname,
        surname: userSurname,
        username: userUsername,
        email: userEmail,
        phone_number: userPhone,
        role_name: userRole,
      });

      if (res.data?.success) {
        showNotification("success", `User @${userUsername} updated!`);
        setEditingUser(null);
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickRoleChange = async (userId: number, newRole: string) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}`, {
        role_name: newRole,
      });
      if (res.data?.success) {
        showNotification("success", `Role set to ${newRole.toUpperCase()}.`);
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to change role.");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      setActionLoading(true);
      const res = await axiosInstance.delete(`/admin/users/${deletingUser.user_id}`);
      if (res.data?.success) {
        showNotification("success", `User @${deletingUser.username} deleted.`);
        setDeletingUser(null);
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reservation Handlers
  const handleReservationStatus = async (
    reservationId: number,
    status: "confirmed" | "canceled" | "pending"
  ) => {
    try {
      setActionLoading(true);
      const endpoint = isAdmin ? `/admin/reservations/${reservationId}` : `/spaces/managed/reservations/${reservationId}`;
      const res = await axiosInstance.patch(endpoint, { status });
      if (res.data?.success) {
        showNotification("success", `Booking marked as ${status}.`);
        fetchData();
      }
    } catch (err: any) {
      showNotification("error", err.response?.data?.message || "Failed to update booking.");
    } finally {
      setActionLoading(false);
    }
  };

  // Date & Time Helpers
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatBookingDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatBookingTime = (startStr?: string, endStr?: string) => {
    if (!startStr) return "—";
    try {
      const s = new Date(startStr);
      const sTime = s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      if (!endStr) return sTime;
      const e = new Date(endStr);
      const eTime = e.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const diffHours = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60)));
      return `${sTime} — ${eTime} (${diffHours} hr${diffHours > 1 ? "s" : ""})`;
    } catch {
      return `${startStr} — ${endStr}`;
    }
  };

  // Filtered lists
  const filteredSpaces = useMemo(() => {
    return spaces.filter((sp) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        sp.space_name.toLowerCase().includes(q) ||
        sp.city.toLowerCase().includes(q) ||
        sp.address.toLowerCase().includes(q) ||
        (sp.creator_email && sp.creator_email.toLowerCase().includes(q));

      const matchesStatus =
        spacesFilter === "all" ||
        (spacesFilter === "active" && sp.is_active === 1) ||
        (spacesFilter === "paused" && sp.is_active !== 1);

      return matchesSearch && matchesStatus;
    });
  }, [spaces, searchQuery, spacesFilter]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        r.fname.toLowerCase().includes(q) ||
        r.surname.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.space_name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q);

      const matchesStatus =
        resFilter === "all" || r.reservation_status === resFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchQuery, resFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        u.fname.toLowerCase().includes(q) ||
        u.surname.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone_number.toLowerCase().includes(q);

      const matchesRole =
        usersFilter === "all" || u.role_name.toLowerCase() === usersFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, usersFilter]);

  return (
    <div
      className="min-h-screen text-zinc-900 antialiased flex flex-col justify-between selection:bg-zinc-950 selection:text-white"
      style={{ backgroundColor: "#f8f6f2" }}
    >
      <Navbar />

      <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Ambient glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[700px] h-[350px] rounded-full bg-amber-300/15 blur-[100px]" />
          <div className="absolute top-48 right-10 w-96 h-96 rounded-full bg-blue-400/10 blur-[90px]" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* Toast / Notification Banner */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border shadow-sm ${
                  notification.type === "success"
                    ? "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-800"
                    : "bg-rose-500/[0.08] border-rose-500/20 text-rose-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {notification.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Header & Metrics KPI Overview */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  {isAdmin ? "Monet Admin Operations" : "Host Management Portal"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 mt-0.5">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Manage your registered spaces and review incoming guest booking requests.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fetchData()}
                  title="Refresh telemetry"
                  className="p-2.5 rounded-full border border-zinc-200/90 bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition shadow-sm active:scale-95"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={openAddSpaceModal}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-zinc-950 text-white px-5 py-2.5 text-xs font-bold hover:bg-zinc-800 transition shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Coworking Space</span>
                </button>
              </div>
            </div>

            {/* 2 KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-sm">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Active Spaces
                </div>
                <div className="text-2xl font-bold text-zinc-950 mt-1">
                  {stats.active_spaces} Spaces
                </div>
                <div className="text-[11.5px] text-emerald-600 font-medium mt-1">
                  ● 100% Online & Listed
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-sm">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Pending Requests
                </div>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {stats.pending_requests} Requests
                </div>
                <div className="text-[11.5px] text-zinc-500 font-medium mt-1">
                  Requires host approval
                </div>
              </div>
            </div>
          </div>

          {/* Main Navigation Tabs: 1. Manage Spaces | 2. Booking Requests | (3. Users if admin) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 pb-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("spaces");
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${
                activeTab === "spaces"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:text-zinc-950 bg-white/70 hover:bg-white"
              }`}
            >
              My Coworking Spaces ({spaces.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("requests");
                setSearchQuery("");
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                activeTab === "requests"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:text-zinc-950 bg-white/70 hover:bg-white"
              }`}
            >
              <span>Incoming Requests</span>
              <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 font-mono text-[10.5px] font-extrabold flex items-center justify-center">
                {stats.pending_requests}
              </span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("users");
                  setSearchQuery("");
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  activeTab === "users"
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:text-zinc-950 bg-white/70 hover:bg-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>People & Roles ({users.length})</span>
              </button>
            )}
          </div>

          {/* ================= SECTION 1: MY COWORKING SPACES ================= */}
          {activeTab === "spaces" && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-950">Managed Spaces</h2>
                  <div className="inline-flex p-0.5 rounded-full bg-zinc-200/60 border border-zinc-200 text-[11px] font-medium">
                    {(["all", "active", "paused"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setSpacesFilter(filter)}
                        className={`px-3 py-1 rounded-full capitalize transition ${
                          spacesFilter === filter
                            ? "bg-white text-zinc-950 font-bold shadow-sm"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search spaces..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-full border border-zinc-200/90 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 transition shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={openAddSpaceModal}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200/90 hover:bg-zinc-50 text-zinc-900 px-3.5 py-1.5 text-xs font-bold shadow-sm transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                  <p className="text-xs text-zinc-400 font-medium">Loading spaces catalog...</p>
                </div>
              ) : filteredSpaces.length === 0 ? (
                <div className="bg-white rounded-3xl border border-zinc-200/90 p-12 text-center shadow-sm">
                  <Building2 className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                  <h4 className="font-bold text-zinc-900 text-sm">No spaces found</h4>
                  <p className="text-xs text-zinc-500 mt-1 mb-5">
                    {searchQuery ? "Try refining your search keyword." : "You have not registered any coworking spaces yet."}
                  </p>
                  <button
                    type="button"
                    onClick={openAddSpaceModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-950 text-white text-xs font-bold shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Space
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-zinc-200/90 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[750px]">
                      <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                        <tr>
                          <th className="py-3.5 px-6">Space Details</th>
                          <th className="py-3.5 px-4">Address</th>
                          <th className="py-3.5 px-4">Available Spots</th>
                          <th className="py-3.5 px-4">Rates (Hour / Day)</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
                        {filteredSpaces.map((sp) => (
                          <tr key={sp.space_id} className="hover:bg-zinc-50/60 transition">
                            <td className="py-4 px-6">
                              <Link
                                to={`/space/${sp.space_id}`}
                                className="font-bold text-zinc-950 text-sm hover:text-amber-600 transition inline-flex items-center gap-1.5"
                              >
                                <span>{sp.space_name}</span>
                                <ExternalLink className="h-3 w-3 text-zinc-400 opacity-60" />
                              </Link>
                              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                ID: #SPC-{sp.space_id} • Created {formatDate(sp.created_at)}
                              </div>
                              {sp.creator_email && isAdmin && (
                                <div className="text-[11px] text-zinc-500 mt-0.5">
                                  Host: {sp.creator_fname} {sp.creator_surname} ({sp.creator_email})
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4 text-zinc-600 max-w-xs truncate">
                              {sp.address}{sp.city ? `, ${sp.city}` : ""}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-semibold text-zinc-900 font-mono">
                                {sp.available_spots} spots
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-zinc-950">
                                €{Number(sp.price_per_hour).toFixed(2)}{" "}
                                <span className="text-[11px] text-zinc-400 font-normal">/ hr</span>
                              </div>
                              <div className="text-[11.5px] text-zinc-500">
                                €{Number(sp.price_per_day).toFixed(2)}{" "}
                                <span className="text-[10.5px] text-zinc-400 font-normal">/ day</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleSpaceActive(sp)}
                                title="Click to toggle status"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border transition cursor-pointer active:scale-95 ${
                                  sp.is_active
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    sp.is_active ? "bg-emerald-500" : "bg-zinc-400"
                                  }`}
                                />
                                {sp.is_active ? "Active" : "Paused"}
                              </button>
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => openEditSpaceModal(sp)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-zinc-300">|</span>
                              <button
                                type="button"
                                onClick={() => setDeletingSpace(sp)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================= SECTION 2: INCOMING BOOKING REQUESTS ================= */}
          {activeTab === "requests" && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-950">
                    Incoming Booking Requests
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Approve or decline customer reservations from the reservations table.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-medium">Filter:</span>
                  <select
                    value={resFilter}
                    onChange={(e: any) => setResFilter(e.target.value)}
                    className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-none shadow-sm cursor-pointer"
                  >
                    <option value="all">All Requests</option>
                    <option value="pending">Pending Only</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                  <p className="text-xs text-zinc-400 font-medium">Loading requests...</p>
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="bg-white rounded-3xl border border-zinc-200/90 p-12 text-center shadow-sm">
                  <Clock className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                  <h4 className="font-bold text-zinc-900 text-sm">No reservations match</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Bookings from platform residents will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReservations.map((r) => {
                    const isPending = r.reservation_status === "pending";
                    const isConfirmed = r.reservation_status === "confirmed";
                    const isCanceled = r.reservation_status === "canceled";

                    return (
                      <div
                        key={r.reservation_id}
                        className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition hover:border-zinc-300"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {isPending && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Pending Approval
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Confirmed
                              </span>
                            )}
                            {isCanceled && (
                              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-semibold text-[11px]">
                                Canceled
                              </span>
                            )}

                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-semibold text-[11px] capitalize">
                              {r.reservation_type || "Hot Desk"}
                            </span>
                            <span className="text-zinc-400 font-mono text-[11px]">
                              #RES-{r.reservation_id}
                            </span>
                          </div>

                          <div>
                            <div className="text-base font-bold text-zinc-950">
                              {r.space_name}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">
                              Guest:{" "}
                              <span className="font-semibold text-zinc-900">
                                {r.fname} {r.surname}
                              </span>{" "}
                              ({r.email}) •{" "}
                              <span className="font-semibold text-zinc-900">
                                {r.guest_count} Guest{r.guest_count === 1 ? "" : "s"}
                              </span>
                              {r.phone_number && (
                                <span className="text-zinc-400 font-mono"> • {r.phone_number}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 font-medium">
                            <span>📅 {formatBookingDate(r.start_time)}</span>
                            <span className="text-zinc-300">•</span>
                            <span>⏰ {formatBookingTime(r.start_time, r.end_time)}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="text-zinc-950 font-bold">
                              Amount: €{Number(r.amount).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons: Approve / Decline */}
                        <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleReservationStatus(r.reservation_id, "confirmed")}
                                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Approve & Send Key</span>
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleReservationStatus(r.reservation_id, "canceled")}
                                className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition active:scale-95"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {isConfirmed && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                ✓ Approved & Pass Issued
                              </span>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleReservationStatus(r.reservation_id, "canceled")}
                                className="text-[11px] text-zinc-400 hover:text-rose-600 underline"
                              >
                                Revoke
                              </button>
                            </div>
                          )}
                          {isCanceled && (
                            <span className="text-xs font-medium text-zinc-400">
                              Declined / Canceled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ================= SECTION 3: USERS & PRIVILEGES (Admin Only) ================= */}
          {activeTab === "users" && isAdmin && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-950">Accounts & Roles</h2>
                  <div className="inline-flex p-0.5 rounded-full bg-zinc-200/60 border border-zinc-200 text-[11px] font-medium">
                    {(["all", "admin", "landlord", "user"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setUsersFilter(role)}
                        className={`px-3 py-1 rounded-full capitalize transition ${
                          usersFilter === role
                            ? "bg-white text-zinc-950 font-bold shadow-sm"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search accounts..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-full border border-zinc-200/90 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 transition shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                  <p className="text-xs text-zinc-400 font-medium">Loading user accounts...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-zinc-200/90 p-12 text-center shadow-sm">
                  <Users className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                  <h4 className="font-bold text-zinc-900 text-sm">No accounts found</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try refining your search keyword or role filter.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-zinc-200/90 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[750px]">
                      <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                        <tr>
                          <th className="py-3.5 px-6">Member</th>
                          <th className="py-3.5 px-4">Contact</th>
                          <th className="py-3.5 px-4">Assigned Role</th>
                          <th className="py-3.5 px-4">Activity</th>
                          <th className="py-3.5 px-4">Joined</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
                        {filteredUsers.map((u) => {
                          const roleName = u.role_name.toLowerCase();
                          const initials = `${u.fname?.[0] || ""}${u.surname?.[0] || ""}`.toUpperCase() || "U";
                          return (
                            <tr key={u.user_id} className="hover:bg-zinc-50/60 transition">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-zinc-950 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm font-mono">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-zinc-950 text-sm">
                                      {u.fname} {u.surname}
                                    </div>
                                    <div className="font-mono text-[11px] text-zinc-400">
                                      @{u.username} • ID #{u.user_id}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1.5 text-zinc-700 font-mono text-xs">
                                  <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
                                  <span className="truncate">{u.email}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] mt-0.5">
                                  <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                                  <span>{u.phone_number || "No phone"}</span>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <select
                                  value={roleName}
                                  onChange={(e) => handleQuickRoleChange(u.user_id, e.target.value)}
                                  className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-white border-zinc-200/90 shadow-sm text-zinc-800 cursor-pointer focus:outline-none"
                                >
                                  <option value="user">Resident (User)</option>
                                  <option value="landlord">Host (Landlord)</option>
                                  <option value="admin">Administrator</option>
                                </select>
                              </td>

                              <td className="py-4 px-4 font-mono text-[11px] text-zinc-500">
                                <span className="font-semibold text-zinc-800">
                                  {u.total_spaces || 0} spaces
                                </span>{" "}
                                • {u.total_reservations || 0} bookings
                              </td>

                              <td className="py-4 px-4 font-mono text-zinc-400 text-[11px]">
                                {formatDate(u.created_at)}
                              </td>

                              <td className="py-4 px-6 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openEditUserModal(u)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  Edit
                                </button>
                                <span className="text-zinc-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => setDeletingUser(u)}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* ================= MODAL: ADD / EDIT COWORKING SPACE ================= */}
      <AnimatePresence>
        {(addSpaceModalOpen || editingSpace) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setAddSpaceModalOpen(false);
                setEditingSpace(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-white rounded-3xl border border-zinc-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4 z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setAddSpaceModalOpen(false);
                  setEditingSpace(null);
                }}
                className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-xl font-bold text-zinc-950">
                  {editingSpace ? "Edit Coworking Space" : "Add Coworking Space"}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Fill in the fields matching the coworking_spaces database table.
                </p>
              </div>

              {/* Form matching coworking_spaces table */}
              <form
                onSubmit={editingSpace ? handleUpdateSpace : handleCreateSpace}
                className="space-y-3.5 text-xs"
              >
                {/* space_name varchar(100) */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                    Space Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    placeholder="e.g. Dzirnavu Creative Studio"
                    className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5"
                  />
                </div>

                {/* address varchar(255) */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    value={spaceAddress}
                    onChange={(e) => setSpaceAddress(e.target.value)}
                    placeholder="e.g. Dzirnavu iela 67, Centrs, Riga"
                    className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={spaceCity}
                      onChange={(e) => setSpaceCity(e.target.value)}
                      placeholder="Riga"
                      className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                      Space Type
                    </label>
                    <select
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                      className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-950 cursor-pointer"
                    >
                      <option value="hot-desk">Hot Desk</option>
                      <option value="dedicated">Dedicated Desk</option>
                      <option value="private-office">Private Office</option>
                      <option value="meeting-room">Meeting Room</option>
                    </select>
                  </div>
                </div>

                {/* available_spots, price_per_hour, price_per_day */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                      Available Spots
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={spaceSpots}
                      onChange={(e) => setSpaceSpots(Number(e.target.value))}
                      placeholder="12"
                      className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                      Price / hr (€)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={spacePriceHour}
                      onChange={(e) => setSpacePriceHour(Number(e.target.value))}
                      placeholder="5.00"
                      className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                      Price / day (€)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min={0}
                      value={spacePriceDay}
                      onChange={(e) => setSpacePriceDay(Number(e.target.value))}
                      placeholder="25.00"
                      className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                </div>

                {/* space_description */}
                <div>
                  <label className="block text-[11.5px] font-semibold text-zinc-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={spaceDescription}
                    onChange={(e) => setSpaceDescription(e.target.value)}
                    placeholder="Describe desks, fiber internet, amenities and access instructions..."
                    className="w-full rounded-xl bg-zinc-50/80 border border-zinc-200 p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-950 resize-none"
                  />
                </div>

                {/* Amenities Component */}
                <div className="pt-2 border-t border-zinc-100">
                  <AmenitySelector
                    selected={spaceAmenities}
                    onChange={setSpaceAmenities}
                  />
                </div>

                {/* is_active checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 select-none">
                    <input
                      type="checkbox"
                      checked={spaceIsActive}
                      onChange={(e) => setSpaceIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-0"
                    />
                    <span>Publish immediately (Status: Active)</span>
                  </label>
                </div>

                {/* Submit CTA */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddSpaceModalOpen(false);
                      setEditingSpace(null);
                    }}
                    className="px-4 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{editingSpace ? "Save Changes" : "Save Coworking Space"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: DELETE SPACE ================= */}
      <AnimatePresence>
        {deletingSpace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingSpace(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl border border-zinc-200 max-w-md w-full p-6 sm:p-7 shadow-2xl relative z-10 text-center"
            >
              <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 mb-1">Delete Coworking Space?</h3>
              <p className="text-xs text-zinc-500 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-800">
                  "{deletingSpace.space_name}"
                </span>
                ? Associated guest bookings and photos will be removed.
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingSpace(null)}
                  className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-600 font-semibold text-xs hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteSpace}
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: EDIT USER ================= */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-white rounded-3xl border border-zinc-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Edit Member Privileges</h3>
                  <p className="text-xs text-zinc-400 font-mono">User ID: #{editingUser.user_id}</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4 text-xs font-semibold text-zinc-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={userFname}
                      onChange={(e) => setUserFname(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-normal text-zinc-950 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Surname
                    </label>
                    <input
                      type="text"
                      required
                      value={userSurname}
                      onChange={(e) => setUserSurname(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-normal text-zinc-950 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-normal text-zinc-950 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-normal text-zinc-950 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-normal text-zinc-950 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs font-normal text-zinc-950 focus:outline-none focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="user">Resident (User)</option>
                    <option value="landlord">Host (Landlord)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold transition flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Update Account</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: DELETE USER ================= */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingUser(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl border border-zinc-200 max-w-md w-full p-6 sm:p-7 shadow-2xl relative z-10 text-center"
            >
              <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 mb-1">Delete Account?</h3>
              <p className="text-xs text-zinc-500 mb-6">
                Permanently remove{" "}
                <span className="font-semibold text-zinc-800">
                  {deletingUser.fname} {deletingUser.surname} (@{deletingUser.username})
                </span>
                ? Associated spaces and reservations will be cleaned up.
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-600 font-semibold text-xs hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteUser}
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
