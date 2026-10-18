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
  XCircle,
  AlertCircle,
  Loader2,
  Users,
  MapPin,
  Euro,
  X,
  Search,
  Mail,
  Phone,
  Power,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  Sparkles,
  Shield,
  Layers,
  ChevronDown,
} from "lucide-react";
import type { Route } from "./+types/admindashboard";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import axiosInstance, { getCurrentUser } from "../axios";
import { AmenitySelector } from "../components/AmenityItem";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Console — Monet Operations" },
    { name: "description", content: "Executive operations hub for managing spaces, user privileges, and guest reservations." },
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
  const [activeTab, setActiveTab] = useState<"spaces" | "users" | "requests">("spaces");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [spacesFilter, setSpacesFilter] = useState<"all" | "active" | "paused">("all");
  const [usersFilter, setUsersFilter] = useState<"all" | "admin" | "landlord" | "user">("all");
  const [resFilter, setResFilter] = useState<"all" | "pending" | "confirmed" | "canceled">("all");

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

  // Space Management Handlers
  const openAddSpaceModal = () => {
    setSpaceName("");
    setSpaceAddress("");
    setSpaceCity("Riga");
    setSpaceType("hot-desk");
    setSpaceSpots(10);
    setSpacePriceHour(5.0);
    setSpacePriceDay(25.0);
    setSpaceDescription("");
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

  // User Management Handlers
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

  // Reservation Management Handlers
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

  // Helpers
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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
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
        (spacesFilter === "active" && sp.is_active) ||
        (spacesFilter === "paused" && !sp.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [spaces, searchQuery, spacesFilter]);

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

  // Revenue formatted
  const revenueInt = Math.floor(Number(stats.total_revenue) || 0);
  const revenueDec = (Number(stats.total_revenue) % 1).toFixed(2).split(".")[1] || "00";

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0B0B0C] flex flex-col font-sans selection:bg-zinc-900 selection:text-white text-zinc-900 dark:text-zinc-100 antialiased">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Toast / Notification Banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={`mb-6 p-3.5 rounded-xl flex items-center justify-between text-xs font-medium border shadow-sm ${
                notification.type === "success"
                  ? "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-500/[0.08] border-rose-500/20 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header: Linear / Stripe Style Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 pb-6 border-b border-zinc-200/60 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              <span>Monet {isAdmin ? "Operations" : "Spaces"}</span>
              <span>/</span>
              <span className="text-zinc-600 dark:text-zinc-300 font-semibold">{isAdmin ? "Console" : "Host Studio"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              {isAdmin ? "Admin & Governance" : "Host Management Portal"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isAdmin
                ? "Live inventory control, resident permissions, and platform-wide reservations."
                : "Manage your listed coworking locations, pricing, and incoming resident reservations."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={fetchData}
              title="Refresh telemetry"
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition active:scale-95 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={openAddSpaceModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white font-semibold text-xs tracking-wide transition active:scale-95 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Space</span>
            </button>
          </div>
        </div>

        {/* ─── REDESIGNED TELEMETRY BAR (Integrated Cockpit Strip) ─── */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_24px_-6px_rgba(0,0,0,0.03)] overflow-hidden mb-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/70 dark:divide-zinc-800">
            {/* Cell 1: Gross Platform Revenue */}
            <div className="p-5 sm:p-6 group hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  Gross Volume
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white tabular-nums">
                  €{revenueInt}
                </span>
                <span className="text-lg font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums">
                  .{revenueDec}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>{stats.total_reservations} total bookings</span>
                <span className="font-mono text-zinc-400 dark:text-zinc-500">
                  {stats.pending_requests} pending
                </span>
              </div>
            </div>

            {/* Cell 2: Coworking Spaces & Network */}
            <div className="p-5 sm:p-6 group hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  Active Spaces
                </span>
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                  {stats.active_spaces}/{stats.total_spaces} Online
                </span>
              </div>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white tabular-nums">
                  {stats.total_spaces}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">
                  100% Operational
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Riga, Jurmala & Hubs</span>
                <span className="text-zinc-400 dark:text-zinc-500 font-mono">Managed</span>
              </div>
            </div>

            {/* Cell 3: Desk Capacity */}
            <div className="p-5 sm:p-6 group hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  Available Capacity
                </span>
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                  Desks & Pods
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white tabular-nums">
                  {stats.total_spots}
                </span>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  spots
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <div className="h-1.5 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full" style={{ width: "72%" }} />
                </div>
                <span className="font-mono text-zinc-400 dark:text-zinc-500 text-[10.5px]">72% ready</span>
              </div>
            </div>

            {/* Cell 4: Community & Accounts */}
            <div className="p-5 sm:p-6 group hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  Platform Directory
                </span>
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                  Accounts
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white tabular-nums">
                  {stats.total_users}
                </span>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  members
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Admins, Hosts & Residents</span>
                <span className="font-mono text-zinc-400 dark:text-zinc-500">RBAC</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── NAVIGATION TABS & SEARCH BAR (Segmented Control) ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Segmented Pill Selector with Animated Slider */}
          <div className="inline-flex p-1 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 self-start md:self-auto backdrop-blur-sm">
            {[
              { id: "spaces" as const, label: isAdmin ? "Coworking Spaces" : "My Spaces", count: spaces.length, icon: Building2 },
              ...(isAdmin ? [{ id: "users" as const, label: "People & Roles", count: users.length, icon: Users }] : []),
              { id: "requests" as const, label: isAdmin ? "Reservations" : "Guest Requests", count: reservations.length, icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                  }}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 select-none ${
                    isActive
                      ? "text-zinc-950 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminTab"
                      className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 font-bold"
                          : "bg-zinc-200/70 dark:bg-zinc-700/50 text-zinc-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "spaces"
                  ? "Search by space, city, address..."
                  : activeTab === "users"
                  ? "Search by name, email, role..."
                  : "Search guest, space, dates..."
              }
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─── TAB 1: SPACES MANAGEMENT ─── */}
        {activeTab === "spaces" && (
          <div>
            {/* Filter Chips */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1">
                  Status:
                </span>
                {(["all", "active", "paused"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSpacesFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                      spacesFilter === filter
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-sm"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {filter === "all" ? "All Spaces" : filter}
                  </button>
                ))}
              </div>

              <span className="text-xs text-zinc-400 font-mono">
                {filteredSpaces.length} of {spaces.length} spaces
              </span>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-400 font-medium">Syncing space catalog...</p>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-12 text-center">
                <Building2 className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">No spaces found</h4>
                <p className="text-xs text-zinc-500 mt-1 mb-5">
                  {searchQuery ? "Try refining your search keyword." : "No registered spaces in system."}
                </p>
                <button
                  type="button"
                  onClick={openAddSpaceModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Space
                </button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <table className="w-full min-w-[1050px] table-fixed text-left">
                  <thead className="bg-zinc-50/70 dark:bg-zinc-900 text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800">
                    <tr>
                      <th scope="col" className="w-[28%] px-5 py-3">Space & Host</th>
                      <th scope="col" className="w-[20%] px-5 py-3">Location</th>
                      <th scope="col" className="w-[14%] px-5 py-3">Capacity</th>
                      <th scope="col" className="w-[14%] px-5 py-3">Rates</th>
                      <th scope="col" className="w-[12%] px-5 py-3">Status</th>
                      <th scope="col" className="w-[12%] px-5 py-3 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80 text-xs">
                    {filteredSpaces.map((sp) => (
                      <tr key={sp.space_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        {/* Space & Host */}
                        <td className="px-5 py-4">
                          <div>
                            <Link
                              to={`/space/${sp.space_id}`}
                              className="font-bold text-zinc-950 dark:text-white text-[13.5px] hover:text-blue-600 dark:hover:text-blue-400 transition inline-flex items-center gap-1.5"
                            >
                              <span>{sp.space_name}</span>
                              <ExternalLink className="h-3 w-3 text-zinc-400 opacity-60" />
                            </Link>
                            <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                              ID #{sp.space_id} · Added {formatDate(sp.created_at)}
                            </p>
                            {sp.creator_email && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                Host: {sp.creator_fname} {sp.creator_surname} ({sp.creator_email})
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-200">{sp.city || "Riga"}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{sp.address}</p>
                        </td>

                        {/* Type & Spots */}
                        <td className="px-5 py-4">
                          <p className="font-medium capitalize text-zinc-900 dark:text-zinc-200">
                            {sp.space_type.replace("-", " ")}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                              {sp.available_spots} desks
                            </span>
                            {sp.amenities && sp.amenities.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                                {sp.amenities.length} perks
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-zinc-950 dark:text-zinc-100 tabular-nums">
                            €{Number(sp.price_per_hour).toFixed(2)}{" "}
                            <span className="text-[11px] font-normal text-zinc-400">/hr</span>
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums mt-0.5">
                            €{Number(sp.price_per_day).toFixed(2)} /day
                          </p>
                        </td>

                        {/* 1-Click Status Switch */}
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleToggleSpaceActive(sp)}
                            title="Click to toggle status"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition active:scale-95 cursor-pointer"
                            style={{
                              backgroundColor: sp.is_active ? "rgba(16, 185, 129, 0.08)" : "rgba(113, 113, 122, 0.08)",
                              borderColor: sp.is_active ? "rgba(16, 185, 129, 0.25)" : "rgba(113, 113, 122, 0.2)",
                              color: sp.is_active ? "#059669" : "#71717A",
                            }}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                sp.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                              }`}
                            />
                            <span>{sp.is_active ? "Active" : "Paused"}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right pr-6">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditSpaceModal(sp)}
                              title="Edit space"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSpace(sp)}
                              title="Delete space"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: USERS MANAGEMENT (Admin only) ─── */}
        {activeTab === "users" && isAdmin && (
          <div>
            {/* Filter Chips */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1">
                  Role:
                </span>
                {(["all", "admin", "landlord", "user"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUsersFilter(role)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                      usersFilter === role
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-sm"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {role === "all" ? "All Roles" : role}
                  </button>
                ))}
              </div>

              <span className="text-xs text-zinc-400 font-mono">
                {filteredUsers.length} of {users.length} users
              </span>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-400 font-medium">Syncing directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-12 text-center">
                <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">No accounts found</h4>
                <p className="text-xs text-zinc-500 mt-1">Try refining your search keyword or role filter.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <table className="w-full min-w-[1050px] table-fixed text-left">
                  <thead className="bg-zinc-50/70 dark:bg-zinc-900 text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800">
                    <tr>
                      <th scope="col" className="w-[28%] px-5 py-3">Member</th>
                      <th scope="col" className="w-[24%] px-5 py-3">Contact</th>
                      <th scope="col" className="w-[18%] px-5 py-3">Privilege Role</th>
                      <th scope="col" className="w-[14%] px-5 py-3">Activity</th>
                      <th scope="col" className="w-[8%] px-5 py-3">Joined</th>
                      <th scope="col" className="w-[8%] px-5 py-3 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80 text-xs">
                    {filteredUsers.map((u) => {
                      const roleName = u.role_name.toLowerCase();
                      const initials = `${u.fname?.[0] || ""}${u.surname?.[0] || ""}`.toUpperCase() || "U";
                      return (
                        <tr key={u.user_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          {/* Member */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm font-mono">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-zinc-950 dark:text-white text-[13.5px] truncate">
                                  {u.fname} {u.surname}
                                </p>
                                <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                                  @{u.username} · ID #{u.user_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                              <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-mono text-[11px] mt-1">
                              <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                              <span>{u.phone_number || "No phone"}</span>
                            </div>
                          </td>

                          {/* Interactive Role Switcher Pill */}
                          <td className="px-5 py-4">
                            <select
                              value={roleName}
                              onChange={(e) => handleQuickRoleChange(u.user_id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer focus:outline-none bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-700 shadow-sm text-zinc-800 dark:text-zinc-200"
                            >
                              <option value="user">Resident (User)</option>
                              <option value="landlord">Host (Landlord)</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>

                          {/* Activity */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                {u.total_spaces || 0} spaces
                              </span>
                              <span>·</span>
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                {u.total_reservations || 0} bks
                              </span>
                            </div>
                          </td>

                          {/* Joined */}
                          <td className="px-5 py-4 font-mono text-zinc-400 dark:text-zinc-500 text-[11px]">
                            {formatDate(u.created_at)}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right pr-6">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditUserModal(u)}
                                title="Edit profile"
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingUser(u)}
                                title="Delete user"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: RESERVATIONS MANAGEMENT ─── */}
        {activeTab === "requests" && (
          <div>
            {/* Filter Chips */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1">
                  Status:
                </span>
                {(["all", "pending", "confirmed", "canceled"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setResFilter(status)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                      resFilter === status
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-sm"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {status === "all" ? "All Bookings" : status}
                  </button>
                ))}
              </div>

              <span className="text-xs text-zinc-400 font-mono">
                {filteredReservations.length} of {reservations.length} bookings
              </span>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <p className="text-xs text-zinc-400 font-medium">Syncing bookings...</p>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-12 text-center">
                <Clock className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">No reservations match</h4>
                <p className="text-xs text-zinc-500 mt-1">Bookings from platform residents will appear here.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <table className="w-full min-w-[1050px] table-fixed text-left">
                  <thead className="bg-zinc-50/70 dark:bg-zinc-900 text-[10.5px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-200/80 dark:border-zinc-800">
                    <tr>
                      <th scope="col" className="w-[24%] px-5 py-3">Resident / Guest</th>
                      <th scope="col" className="w-[22%] px-5 py-3">Target Space</th>
                      <th scope="col" className="w-[20%] px-5 py-3">Booking Schedule</th>
                      <th scope="col" className="w-[12%] px-5 py-3">Type</th>
                      <th scope="col" className="w-[10%] px-5 py-3">Amount</th>
                      <th scope="col" className="w-[12%] px-5 py-3 text-right pr-6">Status & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80 text-xs">
                    {filteredReservations.map((r) => (
                      <tr key={r.reservation_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-zinc-950 dark:text-white text-[13.5px]">
                            {r.fname} {r.surname}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{r.email}</p>
                          <p className="font-mono text-[10px] text-zinc-400 mt-0.5">{r.phone_number}</p>
                        </td>

                        <td className="px-5 py-4">
                          <h5 className="font-semibold text-zinc-900 dark:text-zinc-200">{r.space_name}</h5>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{r.address}, {r.city}</p>
                        </td>

                        <td className="px-5 py-4 font-mono text-zinc-600 dark:text-zinc-300">
                          <p>{formatDateTime(r.start_time)}</p>
                          <p className="text-zinc-400 text-[10.5px] mt-0.5">to {formatDateTime(r.end_time)}</p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                            {r.guest_count} guest{r.guest_count === 1 ? "" : "s"}
                          </span>
                          <p className="text-zinc-400 capitalize text-[11px] mt-0.5">{r.reservation_type}</p>
                        </td>

                        <td className="px-5 py-4 font-bold text-zinc-950 dark:text-white text-sm tabular-nums">
                          €{r.amount}.00
                        </td>

                        <td className="px-5 py-4 text-right pr-6">
                          <div className="flex flex-col items-end gap-1.5">
                            {r.reservation_status === "confirmed" && (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                                Confirmed
                              </span>
                            )}
                            {r.reservation_status === "canceled" && (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 font-mono">
                                Canceled
                              </span>
                            )}
                            {r.reservation_status === "pending" && (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                                Pending
                              </span>
                            )}

                            <div className="flex items-center gap-1 mt-1">
                              {r.reservation_status !== "confirmed" && (
                                <button
                                  type="button"
                                  onClick={() => handleReservationStatus(r.reservation_id, "confirmed")}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10.5px] rounded transition active:scale-95"
                                >
                                  Approve
                                </button>
                              )}
                              {r.reservation_status !== "canceled" && (
                                <button
                                  type="button"
                                  onClick={() => handleReservationStatus(r.reservation_id, "canceled")}
                                  className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 hover:text-rose-600 text-zinc-600 dark:text-zinc-300 font-medium text-[10.5px] rounded transition active:scale-95"
                                >
                                  Decline
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── MODAL 1: ADD NEW SPACE ─── */}
      <AnimatePresence>
        {addSpaceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddSpaceModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">Add Coworking Space</h3>
                  <p className="text-xs text-zinc-500">Register room, desk, or private office.</p>
                </div>
                <button
                  onClick={() => setAddSpaceModalOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSpace} className="space-y-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Space Title
                  </label>
                  <input
                    type="text"
                    required
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    placeholder="e.g. Andrejsala High-Tech Hub"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={spaceCity}
                      onChange={(e) => setSpaceCity(e.target.value)}
                      placeholder="Riga"
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Type</label>
                    <select
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    >
                      <option value="hot-desk">Hot Desk</option>
                      <option value="dedicated">Dedicated Desk</option>
                      <option value="private-office">Private Office</option>
                      <option value="meeting-room">Meeting Room</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={spaceAddress}
                    onChange={(e) => setSpaceAddress(e.target.value)}
                    placeholder="e.g. Eksporta iela 10, Riga"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Capacity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={spaceSpots}
                      onChange={(e) => setSpaceSpots(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Rate / Hr (€)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      min={0}
                      value={spacePriceHour}
                      onChange={(e) => setSpacePriceHour(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Rate / Day (€)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      min={0}
                      value={spacePriceDay}
                      onChange={(e) => setSpacePriceDay(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={spaceDescription}
                    onChange={(e) => setSpaceDescription(e.target.value)}
                    placeholder="Brief highlights, amenities, sound insulation..."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900 resize-none"
                  />
                </div>

                {/* What's included / Amenities Selector */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <AmenitySelector
                    selected={spaceAmenities}
                    onChange={setSpaceAmenities}
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAddSpaceModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white font-semibold transition flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Create Location</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: EDIT SPACE ─── */}
      <AnimatePresence>
        {editingSpace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSpace(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">Edit Space Details</h3>
                  <p className="text-xs text-zinc-400 font-mono">#SPC-{editingSpace.space_id}</p>
                </div>
                <button
                  onClick={() => setEditingSpace(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateSpace} className="space-y-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Space Title
                  </label>
                  <input
                    type="text"
                    required
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={spaceCity}
                      onChange={(e) => setSpaceCity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Type</label>
                    <select
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    >
                      <option value="hot-desk">Hot Desk</option>
                      <option value="dedicated">Dedicated Desk</option>
                      <option value="private-office">Private Office</option>
                      <option value="meeting-room">Meeting Room</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={spaceAddress}
                    onChange={(e) => setSpaceAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Spots</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={spaceSpots}
                      onChange={(e) => setSpaceSpots(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Rate / Hr (€)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      min={0}
                      value={spacePriceHour}
                      onChange={(e) => setSpacePriceHour(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Rate / Day (€)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      min={0}
                      value={spacePriceDay}
                      onChange={(e) => setSpacePriceDay(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={spaceDescription}
                    onChange={(e) => setSpaceDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900 resize-none"
                  />
                </div>

                {/* What's included / Amenities Selector */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <AmenitySelector
                    selected={spaceAmenities}
                    onChange={setSpaceAmenities}
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingSpace(null)}
                    className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white font-semibold transition flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 3: DELETE SPACE ─── */}
      <AnimatePresence>
        {deletingSpace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingSpace(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 text-center"
            >
              <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-1">Delete Location?</h3>
              <p className="text-xs text-zinc-500 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{deletingSpace.space_name}"</span>?
                Associated bookings and photos will be removed.
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingSpace(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteSpace}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 4: EDIT USER ─── */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">Edit Member Privileges</h3>
                  <p className="text-xs text-zinc-400 font-mono">User ID: #{editingUser.user_id}</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
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
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-950 dark:text-white focus:outline-none focus:border-zinc-900"
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
                    className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-white font-semibold transition flex items-center gap-1.5 text-xs shadow-sm"
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

      {/* ─── MODAL 5: DELETE USER ─── */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingUser(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 z-10 text-center"
            >
              <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-1">Delete Account?</h3>
              <p className="text-xs text-zinc-500 mb-6">
                Permanently remove{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {deletingUser.fname} {deletingUser.surname} (@{deletingUser.username})
                </span>
                ? Associated spaces and reservations will be cleaned up.
              </p>

              <div className="flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteUser}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
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
