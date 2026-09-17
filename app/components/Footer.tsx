import { Link } from "react-router";
import { Building2 } from "lucide-react";

const LINKS = {
  Explore: [
    { label: "All Spaces",       href: "/search" },
    { label: "Riga Hubs",        href: "/search?location=Riga" },
    { label: "Tallinn Hubs",     href: "/search?location=Tallinn" },
    { label: "Vilnius Tech Park",href: "/search?location=Vilnius" },
    { label: "Meeting Rooms",    href: "/search?type=meeting-room" },
  ],
  Workspace: [
    { label: "Hot Desks",       href: "/search?type=hot-desk" },
    { label: "Dedicated Desks", href: "/search?type=dedicated" },
    { label: "Private Offices", href: "/search?type=private-office" },
    { label: "Day Passes",      href: "/search" },
  ],
  Account: [
    { label: "Sign In",        href: "/login" },
    { label: "Create Account", href: "/register" },
    { label: "My Bookings",    href: "/bookings" },
    { label: "For Hosts",      href: "/admin" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-amber-100/60 pt-16 pb-10" style={{ background: "#ede9e1" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-zinc-200/60">
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 flex-shrink-0">
                <Building2 className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
              </div>
              <span className="font-display text-[17px] font-bold tracking-tight text-zinc-950 leading-none">Monet</span>
            </Link>
            <p className="mt-4 text-[13px] text-zinc-500 leading-relaxed max-w-xs">
              The on-demand coworking booking network â€” beautiful spaces across Riga, Tallinn, Vilnius and beyond.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {["ðŸ‡±ðŸ‡» Latvia", "ðŸ‡ªðŸ‡ª Estonia", "ðŸ‡±ðŸ‡¹ Lithuania", "ðŸ‡©ðŸ‡ª Germany"].map(c => (
                <span key={c} className="text-[11px] text-zinc-400 font-medium leading-none">{c}</span>
              ))}
            </div>
          </div>

          {(Object.entries(LINKS) as [string, { label: string; href: string }[]][]).map(([title, items]) => (
            <div key={title}>
              <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3 leading-none">{title}</span>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label} className="leading-none">
                    <Link to={href} className="text-[13px] text-zinc-600 hover:text-zinc-950 transition-colors leading-none">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-zinc-400">
          <span className="leading-none">Â© 2026 Monet Hub. All rights reserved.</span>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Security"].map(l => (
              <span key={l} className="leading-none hover:text-zinc-600 transition-colors cursor-pointer">{l}</span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
