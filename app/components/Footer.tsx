import { Link } from "react-router";
import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/80 bg-white pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-100">
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 flex-shrink-0">
                <Building2 className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
              </div>
              <span className="text-[17px] font-bold tracking-tight text-zinc-950 leading-none">Monet</span>
            </Link>
            <p className="mt-4 text-sm text-zinc-500 max-w-xs leading-relaxed">
              On-demand coworking spaces across Riga, Tallinn, Vilnius and beyond.
            </p>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 leading-none">Explore</span>
            <ul className="space-y-2.5">
              <li><Link to="/search"                   className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">All Spaces</Link></li>
              <li><Link to="/search?location=Riga"     className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">Riga</Link></li>
              <li><Link to="/search?location=Tallinn"  className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">Tallinn</Link></li>
              <li><Link to="/search?location=Vilnius"  className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">Vilnius</Link></li>
            </ul>
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3 leading-none">Account</span>
            <ul className="space-y-2.5">
              <li><Link to="/login"    className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">Sign In</Link></li>
              <li><Link to="/register" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">Register</Link></li>
              <li><Link to="/bookings" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">My Bookings</Link></li>
              <li><Link to="/admin"    className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors leading-none">For Hosts</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <span className="leading-none">Â© 2026 Monet Hub. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span className="leading-none cursor-pointer hover:text-zinc-600 transition-colors">Privacy</span>
            <span className="leading-none cursor-pointer hover:text-zinc-600 transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
