import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Building2, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import axiosInstance, { saveSession } from '../axios';

function showError(elementId: string, message: string) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

export function isValidEmail(email: string): boolean {
    const MAX_EMAIL_LENGTH = 50;
    const isInvalidInput = !email || email.length === 0 || email.length > MAX_EMAIL_LENGTH;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(email) && !isInvalidInput) {
        showError("emailError", "");
        return true;
    } else {
        showError("emailError", "Enter a valid email address.");
        return false;
    }
}

export function isValidPassword(password: string): boolean {
    const MAX_PASSWORD_LENGTH = 50;
    const MIN_PASSWORD_LENGTH = 8;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,50}$/;

    if (passwordRegex.test(password) && password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH) {
        showError("passwordError", "");
        return true;
    } else {
        showError("passwordError", "Password must be at least 8 characters and include letters and a digit.");
        return false;
    }
}

export default function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setGlobalError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        const validEmail = isValidEmail(email);
        const validPassword = isValidPassword(password);
        if (!validEmail || !validPassword) return;

        setLoading(true);
        try {
            // Поддержка входа как по email, так и по username
            const response = await axiosInstance.post("/auth/login", {
                identifier: email,
                password,
            });

            // Наш бэкенд возвращает { success, token, user }
            const { token, user } = response.data;
            saveSession(token, user);
            navigate("/");
        } catch (error: unknown) {
            const axiosErr = error as {
                response?: {
                    data?: { message?: string; errors?: { field: string; message: string }[] };
                    status?: number;
                };
                message?: string;
            };
            const apiMsg = axiosErr.response?.data?.message;
            const apiErrors = axiosErr.response?.data?.errors;

            if (apiErrors && apiErrors.length > 0) {
                apiErrors.forEach((e) => showError(`${e.field}Error`, e.message));
            } else {
                setGlobalError(apiMsg || "Login failed. Please check your credentials.");
            }
        } finally {
            setLoading(false);
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

                {globalError && (
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <p className="text-xs text-red-600">{globalError}</p>
                    </div>
                )}

                <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
                    <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Email or Username</label>
                    <input type="text" name="email" id="login-email" autoComplete="username"
                        className="bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition" />
                    <p id="emailError" className="text-red-500 text-[12px] mt-1.25 min-h-4.5"></p>

                    <label className="text-[12px] mt-3 mb-1.25 text-[#3F3F46] font-semibold">Password</label>
                    <input type="password" name="password" id="login-password" autoComplete="current-password"
                        className="bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition" />
                    <p id="passwordError" className="text-red-500 text-[12px] mt-1.25 min-h-4.5"></p>

                    <button type="submit" disabled={loading}
                        className="flex items-center justify-center gap-2 bg-[#09090B] hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-white font-bold text-[13px] rounded-full h-[43.5px] mt-3.75 mb-6.25">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : "Continue"}
                    </button>
                </form>
                <p className="text-center text-zinc-500 text-[12px] pt-3.75 border-t border-zinc-100">
                    Don&apos;t have an account? <Link to="/register" className="font-bold text-black">Sign up</Link>
                </p>
            </div>
            <Footer />
        </div>
    );
}