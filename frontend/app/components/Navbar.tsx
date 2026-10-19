import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { Building2, Menu, X, User, LogOut, Calendar, Heart } from "lucide-react";
import { getCurrentUser, clearSession } from "../axios";
import { useFavorites } from "../lib/favorites";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const { count: favoritesCount } = useFavorites();

  // Обновляем состояние пользователя при каждом изменении маршрута и при обновлении профиля
  useEffect(() => {
    const updateUser = () => setUser(getCurrentUser());
    updateUser();
    window.addEventListener("monet:user:updated", updateUser);
    window.addEventListener("storage", updateUser);
    return () => {
      window.removeEventListener("monet:user:updated", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? "bg-zinc-100 text-zinc-900"
      : "text-zinc-600 hover:bg-zinc-100";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-zinc-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950">
              <Building2 className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-zinc-950">Monet</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link to="/search" className={`rounded-full px-3.5 py-2 transition-colors ${isActive("/search")}`}>Explore</Link>
            {user && (
              <Link to="/mybookings" className={`rounded-full px-3.5 py-2 transition-colors ${isActive("/mybookings")}`}>My Bookings</Link>
            )}
            {user && (
              <Link to="/saved" className={`rounded-full px-3.5 py-2 transition-colors flex items-center gap-1.5 ${isActive("/saved")}`}>
                <Heart className={`h-3.5 w-3.5 ${favoritesCount > 0 ? "fill-rose-500 text-rose-500" : "text-zinc-400"}`} />
                <span>Saved</span>
                {favoritesCount > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </Link>
            )}
            {user?.role_name === "admin" && (
              <Link to="/admindashboard" className={`rounded-full px-3.5 py-2 transition-colors ${isActive("/admindashboard")}`}>
                Admin Panel
              </Link>
            )}
            {user?.role_name === "landlord" && (
              <Link to="/admindashboard" className={`rounded-full px-3.5 py-2 transition-colors ${isActive("/admindashboard")}`}>
                Host Portal
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2.5 rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white text-[11px] font-bold">
                    {String(user.username ?? "U")[0].toUpperCase()}
                  </div>
                  <span>{String(user.username ?? "")}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-2xl bg-white border border-zinc-200/80 shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-zinc-100">
                        <p className="text-[12px] font-bold text-zinc-900">{String(user.fname ?? "")} {String(user.surname ?? "")}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{String(user.email ?? "")}</p>
                      </div>
                      <div className="p-1.5">
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                          <User className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
                          Account Settings
                        </Link>
                        <div className="my-1 border-t border-zinc-100" />
                        <button type="button" onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="h-4 w-4" strokeWidth={1.75} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">Sign in</Link>
                <Link to="/register" className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 transition-colors">Get Started</Link>
              </>
            )}
          </div>

          <button type="button" onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-xl p-2 text-zinc-600 hover:bg-zinc-100">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-b border-zinc-200/80 bg-white px-4 py-3">
          <div className="space-y-1">
            <Link to="/search" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Explore</Link>
            {user && (
              <Link to="/mybookings" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">My Bookings</Link>
            )}
            {user && (
              <Link to="/saved" onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Saved Spaces
                </span>
                {favoritesCount > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </Link>
            )}
            {user && (
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Account Settings</Link>
            )}
            {user?.role_name === "admin" && (
              <Link to="/admindashboard" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Admin Panel
              </Link>
            )}
            {user?.role_name === "landlord" && (
              <Link to="/admindashboard" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Host Portal
              </Link>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {user ? (
              <button type="button" onClick={handleLogout}
                className="w-full text-center rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-red-600">
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center rounded-xl bg-zinc-950 py-2.5 text-sm font-bold text-white">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
