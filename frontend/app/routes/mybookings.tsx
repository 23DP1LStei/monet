import { useState } from "react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import ball from "../images/ball.svg";
import person from "../images/person.svg";
import location from "../images/location.svg";
import calendar from "../images/calendar.svg";
import ball_grey from "../images/ball_grey.svg";
import key from "../images/key.svg";

export default function Register() {
const [bookingFilter, setBookingFilter] = useState<"all" | "active" | "upcoming" | "past">("all");

return (
    <div>
        <Navbar />
        <div>
            <div className="flex flex-row m-auto mt-20 mb-20 items-end w-240">
                <div className="m-auto w-240">
                    <h6 className="text-[11px] text-[#A1A1AA] mb-1.25 tracking-[1.1px]">MEMBER PORTAL</h6>
                    <h1 className="text-3xl font-extrabold">My Bookings</h1>
                    <p className="text-sm text-[#71717A]">Manage your active passes, door codes, and past workspace visits.</p>
                </div>
                <div className="flex items-center rounded-xl bg-white border border-zinc-200/80 p-0.5 shadow-sm text-[12px] font-semibold">
                    {(["all", "active", "upcoming", "past"] as const).map(filter => (
                        <button
                            key={filter}
                            type="button"
                            id={`booking-${filter}`}
                            aria-pressed={bookingFilter === filter}
                            onClick={() => setBookingFilter(filter)}
                            className={`rounded-[10px] px-2.5 py-1.5 transition-all duration-200 ${bookingFilter === filter ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-800"}`}
                        >
                            {filter === "all" ? "All" : filter === "active" ? "Active" : filter === "upcoming" ? "Upcoming" : "Past"}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-5">
            <div className="flex flex-row justify-between bg-white m-auto w-240 h-42.5 p-7.5 rounded-3xl border border-zinc-200/80">
                <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2 items-center">
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl w-25 h-5.5 flex flex-row items-center pl-2 pr-2 justify-between">
                        <img src={ball} />
                        <p className="text-[#047857] h-fit text-center text-[11px] pt-0.75 pb-0.75 font-bold">Active Today</p>
                    </div>
                    <div className="bg-[#F4F4F5] border border-[#E4E4E7] rounded-3xl w-17.5 h-5.5">
                        <p className="h-fit text-center text-[11px] pt-0.5 font-semibold">Hot Desk</p>
                    </div>
                    <div className="flex flex-row">
                    <img src={person} />
                    <p className="text-[11px] text-[#A1A1AA] font-medium ml-1">1 Guest</p>
                    <p className="text-[11px] text-[#A1A1AA] font-[Consolas] font-normal ml-2">ID: #RES-10492</p>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-xl font-bold">Andrejsala Workspace</h3>
                    <div className="flex flex-row gap-2">
                    <img src={location} />
                    <p className="text-xs text-[#71717A]">Eksporta iela 10, Andrejsala, Riga</p>
                    </div>
                </div>
                <div className="flex flex-row gap-4 items-center">
                    <div className="flex flex-row gap-2">
                    <img src={calendar} />
                    <p className="font-medium text-xs text-[#52525B]">Wed, 23 Sep 2026</p>
                    </div>
                    <img src={ball_grey} className="w-1 h-1" />
                    <p className="font-[Consolas] text-xs">14:00 — 16:00 (2 Hours)</p>
                </div>
                </div>
                <div>
                    <p className="font-bold text-[10px] text-end text-[#A1A1AA]">Total Paid</p>
                    <h4 className="font-bold text-xl text-end">€29.00</h4>
                    <div className="bg-[#09090B] text-white font-bold text-xs mt-3.75 w-37.5 h-9 rounded-3xl flex flex-row items-center justify-center gap-2">
                    <img src={key} />
                    <p>Door Code & Key</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-row justify-between bg-white m-auto w-240 h-42.5 p-7.5 rounded-3xl border border-zinc-200/80">
                <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2 items-center">
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl w-25 h-5.5 flex flex-row items-center pl-2 pr-2 justify-between">
                        <img src={ball} />
                        <p className="text-[#047857] h-fit text-center text-[11px] pt-0.75 pb-0.75 font-bold">Active Today</p>
                    </div>
                    <div className="bg-[#F4F4F5] border border-[#E4E4E7] rounded-3xl w-17.5 h-5.5">
                        <p className="h-fit text-center text-[11px] pt-0.5 font-semibold">Hot Desk</p>
                    </div>
                    <div className="flex flex-row">
                    <img src={person} />
                    <p className="text-[11px] text-[#A1A1AA] font-medium ml-1">1 Guest</p>
                    <p className="text-[11px] text-[#A1A1AA] font-[Consolas] font-normal ml-2">ID: #RES-10492</p>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-xl font-bold">Andrejsala Workspace</h3>
                    <div className="flex flex-row gap-2">
                    <img src={location} />
                    <p className="text-xs text-[#71717A]">Eksporta iela 10, Andrejsala, Riga</p>
                    </div>
                </div>
                <div className="flex flex-row gap-4 items-center">
                    <div className="flex flex-row gap-2">
                    <img src={calendar} />
                    <p className="font-medium text-xs text-[#52525B]">Wed, 23 Sep 2026</p>
                    </div>
                    <img src={ball_grey} className="w-1 h-1" />
                    <p className="font-[Consolas] text-xs">14:00 — 16:00 (2 Hours)</p>
                </div>
                </div>
                <div>
                    <p className="font-bold text-[10px] text-end text-[#A1A1AA]">Total Paid</p>
                    <h4 className="font-bold text-xl text-end">€29.00</h4>
                    <div className="bg-[#09090B] text-white font-bold text-xs mt-3.75 w-37.5 h-9 rounded-3xl flex flex-row items-center justify-center gap-2">
                    <img src={key} />
                    <p>Door Code & Key</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-row justify-between bg-white m-auto w-240 h-42.5 p-7.5 rounded-3xl border border-zinc-200/80">
                <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2 items-center">
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl w-25 h-5.5 flex flex-row items-center pl-2 pr-2 justify-between">
                        <img src={ball} />
                        <p className="text-[#047857] h-fit text-center text-[11px] pt-0.75 pb-0.75 font-bold">Active Today</p>
                    </div>
                    <div className="bg-[#F4F4F5] border border-[#E4E4E7] rounded-3xl w-17.5 h-5.5">
                        <p className="h-fit text-center text-[11px] pt-0.5 font-semibold">Hot Desk</p>
                    </div>
                    <div className="flex flex-row">
                    <img src={person} />
                    <p className="text-[11px] text-[#A1A1AA] font-medium ml-1">1 Guest</p>
                    <p className="text-[11px] text-[#A1A1AA] font-[Consolas] font-normal ml-2">ID: #RES-10492</p>
                    </div>
                </div>
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-xl font-bold">Andrejsala Workspace</h3>
                    <div className="flex flex-row gap-2">
                    <img src={location} />
                    <p className="text-xs text-[#71717A]">Eksporta iela 10, Andrejsala, Riga</p>
                    </div>
                </div>
                <div className="flex flex-row gap-4 items-center">
                    <div className="flex flex-row gap-2">
                    <img src={calendar} />
                    <p className="font-medium text-xs text-[#52525B]">Wed, 23 Sep 2026</p>
                    </div>
                    <img src={ball_grey} className="w-1 h-1" />
                    <p className="font-[Consolas] text-xs">14:00 — 16:00 (2 Hours)</p>
                </div>
                </div>
                <div>
                    <p className="font-bold text-[10px] text-end text-[#A1A1AA]">Total Paid</p>
                    <h4 className="font-bold text-xl text-end">€29.00</h4>
                    <div className="bg-[#09090B] text-white font-bold text-xs mt-3.75 w-37.5 h-9 rounded-3xl flex flex-row items-center justify-center gap-2">
                    <img src={key} />
                    <p>Door Code & Key</p>
                    </div>
                </div>
            </div>
            </div>
        </div>
        <Footer />
    </div>
);
}