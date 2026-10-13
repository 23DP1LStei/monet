import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

export default function Register() {
return (
    <div>
        <Navbar />
        <div>
            <div className="flex flex-row m-auto mt-20 mb-20 items-end w-240">
                <div className="m-auto w-240">
                    <h6 className="text-[11px]">Member Portal</h6>
                    <h1 className="text-3xl">My Bookings</h1>
                    <p className="text-sm">Manage your active passes, door codes, and past workspace visits.</p>
                </div>
                <div>
                    <ul className="flex flex-row w-max">
                        <li>All (3)</li>
                        <li>Active (1)</li>
                        <li>Upcoming (1)</li>
                        <li>Past (1)</li>
                    </ul>
                </div>
            </div>
            <div className="flex flex-row justify-between bg-white m-auto w-240 h-42.5 p-7.5 rounded-3xl">
                <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2">
                    <p className="bg-[#A7F3D0] rounded-3xl text-[11px] font-bold w-25 h-5.5">Active Today</p>
                    <p className="text-[11px] font-semibold">Hot Desk</p>
                    <p className="text-[11px] font-medium">1 Guest</p>
                    <p className="text-[11px] font-normal">ID: #RES-10492</p>
                </div>
                <div>
                    <h3 className="text-xl">Andrejsala Workspace</h3>
                    <p className="text-xs">Eksporta iela 10, Andrejsala, Riga</p>
                </div>
                <div className="flex flex-row gap-1.25">
                    <p className="font-medium text-xs">Wed, 23 Sep 2026</p>
                    <p className="font-[Consolas] text-xs">14:00 — 16:00 (2 Hours)</p>
                </div>
                </div>
                <div>
                    <p className="font-bold text-[10px]">Total Paid</p>
                    <h4 className="font-bold text-xl">€29.00</h4>
                    <button className="bg-[#09090B] text-white font-bold text-xs mt-3.75 w-37.5 h-9 rounded-3xl">Door Code & Key</button>
                </div>
            </div>
        </div>
        <Footer />
    </div>
);
}