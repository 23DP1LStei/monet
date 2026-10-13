import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Building2 } from "lucide-react";
import axiosInstance from '../axios';

const isClient = typeof window !== 'undefined';
const emailError = isClient ? document.getElementById('emailError') : null;
const passwordError = isClient ? document.getElementById('passwordError') : null;


function showError(el: any, message: string) {
  el.innerHTML = message;
}

export function isValidEmail(email: string): boolean {
    const MAX_EMAIL_LENGTH = 50;
    const isInvalidInput =
        !email || email.length === 0 || email.length > MAX_EMAIL_LENGTH;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(email) && !isInvalidInput) {
        return true;
    } else {
        showError(emailError, "Enter a valid email address.");
        return false;
    }

}

export function isValidPassword(password: string): boolean {
    const MAX_PASSWORD_LENGTH = 50;
    const MIN_PASSWORD_LENGTH = 8;
    
    const isInvalidInput =
        !password || password.length === 0 || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH;

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,50}$/;

    if (passwordRegex.test(password) && !isInvalidInput) {
        return true;
    } else {
        showError(passwordError, "Password must be at least 8 characters.");
        return false;
    }
}

const login = async (payload: any) => {
    console.log('Login function called');
    try { 
        
        const response = await axiosInstance.post("/auth/login", payload);
        console.log(response.data);
        if (response.status === 200) {
            // Store token in localStorage
            localStorage.setItem('auth_token', response.data.api_token);
            localStorage.setItem('csrf_token', response.data.csrf_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Update axios default header with token
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.api_token}`;
            axiosInstance.defaults.headers.common['X-CSRF-TOKEN'] = response.data.csrf_token;
            
            window.location.href = "/";
        }
    } catch (error) {
        console.error(error);
    }
};

export default function LoginPage() {
    function handleSubmit(e: any) {
    // Prevent the browser from reloading the page
    e.preventDefault();

    // Read the form data
    const form = e.target;
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");
    
    let validEmail = isValidEmail(String(email));
    let validPassword = isValidPassword(String(password));

    if (validEmail && validPassword) {
      login(formData);
    }
  }
return (
    <div>
    <Navbar />
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-175 h-105 rounded-full bg-amber-300/20 blur-[100px]" />
          <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-blue-400/10 blur-[80px]" />
          <div className="absolute top-10 -right-32 w-96 h-96 rounded-full bg-sky-300/12 blur-[90px]" />
    </div>
    <div className="bg-white m-auto relative z-10 mt-20 mb-20 w-97.5 p-8 rounded-3xl">
        <div className="flex m-auto h-10 w-10 mb-5 items-center justify-center rounded-xl bg-zinc-950">
              <Building2 className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
        </div>
        <h3 className="text-center text-[22px] mb-1.25 font-extrabold">Sign in to Monet</h3>
        <p className="text-center text-[12px] mb-5 text-zinc-500">Welcome back. Please enter your details.</p>
        <form className="flex flex-col" onSubmit={handleSubmit}>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Email</label>
            <input type="email" name="email" className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-5 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <p id="emailError"></p>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Password</label>
            <input type="password" name="password" className="bg-[#FAFAFA] outline outline-[#E4E4E7] mb-3.75 rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <p id="passwordError"></p>
            <input type="submit" value="Continue" className="bg-[#09090B] hover:bg-zinc-800 transition-all cursor-pointer text-white font-bold text-[13px] rounded-full w-81.5 h-[43.5px] mb-6.25"/>
        </form>
        <p className="text-center text-zinc-500 text-[12px] pt-3.75 border-t border-zinc-100">Don't have an account?  <a href="#" className="font-bold text-black">Sign up</a></p>
    </div>
    <Footer />
    </div>
    );
}