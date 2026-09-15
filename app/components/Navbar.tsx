import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Building2, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
            <Link to="/search"   className="rounded-full px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 transition-colors">Explore</Link>
            <Link to="/bookings" className="rounded-full px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 transition-colors">My Bookings</Link>
            <Link to="/admin"    className="rounded-full px-3.5 py-2 text-zinc-600 hover:bg-zinc-100 transition-colors">For Hosts</Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/login"    className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">Sign in</Link>
            <Link to="/register" className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 transition-colors">Get Started</Link>
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
            <Link to="/search"   onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Explore</Link>
            <Link to="/bookings" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">My Bookings</Link>
            <Link to="/admin"    onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">For Hosts</Link>
          </div>
          <div className="mt-3 flex gap-2">
            <Link to="/login"    onClick={() => setMobileOpen(false)} className="flex-1 text-center rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800">Sign In</Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center rounded-xl bg-zinc-950 py-2.5 text-sm font-bold text-white">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
