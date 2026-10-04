import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Building2 } from "lucide-react";

export default function Register() {
return (
    <div>
    <Navbar />
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full bg-amber-300/20 blur-[100px]" />
          <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-blue-400/10 blur-[80px]" />
          <div className="absolute top-10 -right-32 w-96 h-96 rounded-full bg-sky-300/12 blur-[90px]" />
    </div>
    <div className="bg-white m-0 m-auto relative z-10 mt-[80px] mb-[80px] w-[440px] p-[32px] rounded-3xl">
        <div className="flex m-0 m-auto h-10 w-10 mb-[20px] items-center justify-center rounded-xl bg-zinc-950">
              <Building2 className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
        </div>
        <h3 className="text-center text-[22px] mb-[5px] font-extrabold">Create your account</h3>
        <p className="text-center text-[12px] mb-[20px] text-zinc-500">Join Monet for instant desk bookings & digital keys.</p>
        <form className="flex flex-col">
            <div className="flex flex-row gap-[12px]">
                <div className="flex flex-col">
                    <label className="text-[12px] mb-[5px] text-[#3F3F46] font-semibold">First name</label>
                    <input className=" w-full bg-[#FAFAFA] outline outline-[#E4E4E7] mb-[20px] rounded-2xl pt-[10px] pb-[10px] pl-[14px] pr-[14px] focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
                </div>
                <div className="flex flex-col">
                    <label className="text-[12px] mb-[5px] text-[#3F3F46] font-semibold">Last name</label>
                    <input className="w-full bg-[#FAFAFA] outline outline-[#E4E4E7] mb-[20px] rounded-2xl pt-[10px] pb-[10px] pl-[14px] pr-[14px] focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
                </div>
            </div>
            <label className="text-[12px] mb-[5px] text-[#3F3F46] font-semibold">Username</label>
            <input className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-[20px] rounded-2xl pt-[10px] pb-[10px] pl-[14px] pr-[14px] focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <label className="text-[12px] mb-[5px] text-[#3F3F46] font-semibold">Email</label>
            <input type="email" className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-[20px] rounded-2xl pt-[10px] pb-[10px] pl-[14px] pr-[14px] focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/> 
            <label className="text-[12px] mb-[5px] text-[#3F3F46] font-semibold">Phone number</label>
            <input type="tel " className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-[20px] rounded-2xl pt-[10px] pb-[10px] pl-[14px] pr-[14px] focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <label className="text-[12px] mb-[5px] text-[#3F3F46] font-semibold">Password</label>
            <input type="password" className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-[20px] rounded-2xl pt-[10px] pb-[10px] pl-[14px] pr-[14px] focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <input type="submit" value="Create Account" className="bg-[#09090B] hover:bg-zinc-800 transition-all cursor-pointer text-white font-bold text-[13px] rounded-full w-[377px] h-[43.5px] mb-[25px]"/>
        </form>
        <p className="text-center text-zinc-500 text-[12px] pt-[15px] border-t border-zinc-100">Already have an account?  <a href="#" className="font-bold text-black">Sign in</a></p>
    </div>
    <Footer />
    </div>
    );
}