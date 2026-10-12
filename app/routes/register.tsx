import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Building2 } from "lucide-react";

export function isValidEmail(email: string): boolean {
  const MAX_EMAIL_LENGTH = 254;
  const isInvalidInput =
    !email || email.length === 0 || email.length > MAX_EMAIL_LENGTH;

  if (isInvalidInput) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function Register() {
    function handleSubmit(e: any) {
        // Prevent the browser from reloading the page
        e.preventDefault();
    
        // Read the form data
        const form = e.target;
        const formData = new FormData(form);
        const query = formData.get("query");
        console.log(isValidEmail(String(query)));
      }
return (
    <div>
    <Navbar />
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-175 h-105 rounded-full bg-amber-300/20 blur-[100px]" />
          <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-blue-400/10 blur-[80px]" />
          <div className="absolute top-10 -right-32 w-96 h-96 rounded-full bg-sky-300/12 blur-[90px]" />
    </div>
    <div className="bg-white m-auto relative z-10 mt-20 mb-20 w-110 p-8 rounded-3xl">
        <div className="flex m-auto h-10 w-10 mb-5 items-center justify-center rounded-xl bg-zinc-950">
              <Building2 className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
        </div>
        <h3 className="text-center text-[22px] mb-1.25 font-extrabold">Create your account</h3>
        <p className="text-center text-[12px] mb-5 text-zinc-500">Join Monet for instant desk bookings & digital keys.</p>
        <form className="flex flex-col">
            <div className="flex flex-row gap-3">
                <div className="flex flex-col">
                    <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">First name</label>
                    <input className=" w-full bg-[#FAFAFA] outline outline-[#E4E4E7] mb-5 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
                </div>
                <div className="flex flex-col">
                    <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Last name</label>
                    <input className="w-full bg-[#FAFAFA] outline outline-[#E4E4E7] mb-5 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
                </div>
            </div>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Username</label>
            <input className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-5 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Email</label>
            <input type="email" className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-5 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/> 
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Phone number</label>
            <input type="tel " className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-5 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Password</label>
            <input type="password" className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-5 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <input type="submit" value="Create Account" className="bg-[#09090B] hover:bg-zinc-800 transition-all cursor-pointer text-white font-bold text-[13px] rounded-full w-94.25 h-[43.5px] mb-6.25"/>
        </form>
        <p className="text-center text-zinc-500 text-[12px] pt-3.75 border-t border-zinc-100">Already have an account?  <a href="#" className="font-bold text-black">Sign in</a></p>
    </div>
    <Footer />
    </div>
    );
}