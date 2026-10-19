import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import ball from "../images/ball.svg"

export default function LoginPage() {
    return (
        <div>
            <Navbar />
            <div className="m-auto w-7xl pl-8 pr-8">
            <div className="w-240">
                <h6 className="text-[11px] text-[#A1A1AA] mb-1.25 tracking-[1.1px]">HOST MANAGEMENT PORTAL</h6>
                <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
                <p className="text-sm text-[#71717A]">Manage your registered spaces and review incoming guest booking requests.</p>
            </div>

            <div className="flex flex-row justify-between">
                <div className="w-150 h-28.75 bg-[#FFFFFF]">
                    <h6>ACTIVE SPACES</h6>
                    <h1>3 Spaces</h1>
                    <p>● 100% Online & Listed</p>
                </div>
                <div className="w-150 h-28.75 bg-[#FFFFFF]">
                    <h6>PENDING REQUESTS</h6>
                    <h1>2 Requests</h1>
                    <p>Requires host approval</p>
                </div>
            </div>
            <div>
                <div>
                    <p>My Coworking Spaces (3)</p>
                </div>
                <div>
                    <p>Incoming Requests</p>
                    <p></p>
                </div>

                <div className="">
                    <h3>Managed Spaces</h3>

                    <div className="w-full overflow-x-auto rounded-3xl border border-[#E4E4E7] bg-white">
                        <table className="w-full min-w-[1050px] table-fixed text-left">
                            <thead className="bg-[#FBFBFB] text-[11px] font-bold text-[#A1A1AA]">
                                <tr>
                                    <th scope="col" className="w-[24%] px-5 py-3.5">SPACE DETAILS</th>
                                    <th scope="col" className="w-[23%] px-5 py-3.5">ADDRESS</th>
                                    <th scope="col" className="w-[12%] px-5 py-3.5">AVAILABLE SPOTS</th>
                                    <th scope="col" className="w-[17%] px-5 py-3.5">RATES (HOUR/DAY)</th>
                                    <th scope="col" className="w-[10%] px-5 py-3.5">STATUS</th>
                                    <th scope="col" className="w-[14%] px-5 py-3.5">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E4E7] text-xs">
                                <tr>
                                    <td className="px-5 py-4">
                                        <h4 className="font-bold text-[#09090B] text-[14px]">Andrejsala Workspace</h4>
                                        <p className="mt-1 font-[Consolas] text-[11px] text-[#A1A1AA]">ID: #SPC-101 · Created 12 Aug 2026</p>
                                    </td>
                                    <td className="px-5 py-4 text-[#52525B] text-xs">Eksporta iela 10, Andrejsala, Riga</td>
                                    <td className="px-5 py-4 font-bold font-[Consolas] text-[#18181B]">16 spots</td>
                                    <td className="px-5 py-4">
                                        <p><span className="font-semibold text-[#09090B]">€6.00</span> <span className="text-[#71717A]">/ hr</span></p>
                                        <p className="mt-1"><span className="font-semibold text-[#09090B]">€29.00</span> <span className="text-[#71717A]">/ day</span></p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#047857]">
                                            <img src={ball} alt="" className="h-2 w-2" />Active
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <button className="font-medium text-[#2563EB] hover:underline">Edit</button>
                                            <p className="text-[#D4D4D8]">|</p>
                                            <button className="font-medium text-[#DC2626] hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-4">
                                        <h4 className="font-bold text-[#09090B] text-[14px]">Skanste Tech Hub</h4>
                                        <p className="mt-1 font-[Consolas] text-[11px] text-[#A1A1AA]">ID: #SPC-102 · Created 20 Aug 2026</p>
                                    </td>
                                    <td className="px-5 py-4 text-[#52525B] text-xs">Skanstes iela 25, Skanste, Riga</td>
                                    <td className="px-5 py-4 font-bold font-[Consolas] text-[#18181B] text-xs">24 spots</td>
                                    <td className="px-5 py-4">
                                        <p><span className="font-semibold text-[#09090B]">€5.00</span> <span className="text-[#71717A]">/ hr</span></p>
                                        <p className="mt-1"><span className="font-semibold text-[#09090B]">€22.00</span> <span className="text-[#71717A]">/ day</span></p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#047857]">
                                            <img src={ball} alt="" className="h-2 w-2" />Active
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <button className="font-medium text-[#2563EB] hover:underline">Edit</button>
                                            <p className="text-[#D4D4D8]">|</p>
                                            <button className="font-medium text-[#DC2626] hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-4">
                                        <h4 className="font-bold text-[#09090B] text-[14px]">Telliskivi Creative Desk</h4>
                                        <p className="mt-1 font-[Consolas] text-[11px] text-[#A1A1AA]">ID: #SPC-103 · Created 01 Sep 2026</p>
                                    </td>
                                    <td className="px-5 py-4 text-[#52525B] text-xs">Telliskivi 60a, Kalamaja, Tallinn</td>
                                    <td className="px-5 py-4 font-bold font-[Consolas] text-[#18181B] text-xs">8 spots</td>
                                    <td className="px-5 py-4">
                                        <p><span className="font-semibold text-[#09090B]">€7.00</span> <span className="text-[#71717A]">/ hr</span></p>
                                        <p className="mt-1"><span className="font-semibold text-[#09090B]">€32.00</span> <span className="text-[#71717A]">/ day</span></p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#047857]">
                                            <img src={ball} alt="" className="h-2 w-2" />Active
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <button className="font-medium text-[#2563EB] hover:underline">Edit</button>
                                            <p className="text-[#D4D4D8]">|</p>
                                            <button className="font-medium text-[#DC2626] hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>    
            </div>
            <Footer />
        </div>
    )
}