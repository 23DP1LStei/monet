import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import axiosInstance, { saveSession } from '../axios';

function showError(elementId: string, message: string) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

export function isValidFisrtName(fname: string): boolean {
    const MAX_FNAME_LENGTH = 50;

    const isInvalidInput =
        !fname || fname.length === 0 || fname.length > MAX_FNAME_LENGTH;

    const fnameRegex = /^[^\d]+$/;

    if (fnameRegex.test(fname) && !isInvalidInput) {
        showError("fnameError", "");
        return true;
    } else {
        showError("fnameError", "Name should be 50 characters or less and without numbers.");
        return false;
    }

}

export function isValidSurname(surname: string): boolean {
    const MAX_SURNAME_LENGTH = 50;

    const isInvalidInput =
        !surname || surname.length === 0 || surname.length > MAX_SURNAME_LENGTH;

    const lnameRegex = /^[^\d]+$/;

    if (lnameRegex.test(surname) && !isInvalidInput) {
        showError("surnameError", "");
        return true;
    } else {
        showError("surnameError", "Name should be 50 characters or less and without numbers.");
        return false;
    }

}


export function isValidEmail(email: string): boolean {
    const MAX_EMAIL_LENGTH = 50;
    const isInvalidInput =
        !email || email.length === 0 || email.length > MAX_EMAIL_LENGTH;

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
    
    const isInvalidInput =
        !password || password.length === 0 || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH;

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,50}$/;

    if (passwordRegex.test(password) && !isInvalidInput) {
        showError("passwordError", "");
        return true;
    } else {
        showError("passwordError", "Password must be at least 7 characters.");
        return false;
    }
}

export function isValidUsername(username: string): boolean {
    const MAX_USERNAME_LENGTH = 20;
    const MIN_USERNAME_LENGTH = 3;
    
    const isInvalidInput =
        !username || username.length === 0 || username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH;

    const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z\d]{3,20}$/;

    if (usernameRegex.test(username) && !isInvalidInput) {
        showError("usernameError", "");
        return true;
    } else {
        showError("usernameError", "Username must be from 3 to 20 characters.");
        return false;
    }
}

export function isValidPhoneNumber(phone_number: string): boolean {
    const MAX_PHONE_NUMBER_LENGTH = 15;
    const MIN_PHONE_NUMBER_LENGTH = 7;
    
    const isInvalidInput =
        !phone_number || phone_number.length === 0 || phone_number.length < MIN_PHONE_NUMBER_LENGTH || phone_number.length > MAX_PHONE_NUMBER_LENGTH;

    const phoneNumberRegex = /^\+?[0-9\s\-()]{7,15}$/;

    if (phoneNumberRegex.test(phone_number) && !isInvalidInput) {
        showError("phoneNumberError", "");
        return true;
    } else {
        showError("phoneNumberError", "Phone number must be from 7 to 15 digits.");
        return false;
    }
}

const register = async (payload: Record<string, string>, navigate: (path: string) => void) => {
    try {
        const response = await axiosInstance.post("/auth/register", payload);
        if (response.status === 201) {
            // Mūsu bēkends atgriež { success, token, user }
            saveSession(response.data.token, response.data.user);
            navigate("/");
        }
    } catch (error: unknown) {
        const axiosErr = error as {
            response?: { data?: { message?: string; errors?: { field: string; message: string }[] } };
        };
        const apiErrors = axiosErr.response?.data?.errors;
        const apiMsg = axiosErr.response?.data?.message;

        if (apiErrors && apiErrors.length > 0) {
            apiErrors.forEach((e) => showError(`${e.field}Error`, e.message));
        } else if (apiMsg) {
            // Parāda vispārīgu kļūdu pirmajā pieejamajā laukā
            showError('fnameError', apiMsg);
        }
    }
};

export default function RegisterPage() {
    const navigate = useNavigate();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);
        const fname = String(formData.get("fname") || "").trim();
        const surname = String(formData.get("surname") || "").trim();
        const username = String(formData.get("username") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const phone_number = String(formData.get("phone_number") || "").trim();
        const password = String(formData.get("password") || "");

        const validfname = isValidFisrtName(fname);
        const validsurname = isValidSurname(surname);
        const validusername = isValidUsername(username);
        const validEmail = isValidEmail(email);
        const validPhoneNumber = isValidPhoneNumber(phone_number);
        const validPassword = isValidPassword(password);

        if (validfname && validsurname && validusername && validEmail && validPhoneNumber && validPassword) {
            // Sūta JSON, nevis FormData
            register({ fname, surname, username, email, phone_number, password }, navigate);
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
    <div className="bg-white m-auto relative z-10 mt-20 mb-20 w-110 p-8 rounded-3xl">
        <div className="flex m-auto h-10 w-10 mb-5 items-center justify-center rounded-xl bg-zinc-950">
              <Building2 className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
        </div>
        <h3 className="text-center text-[22px] mb-1.25 font-extrabold">Create your account</h3>
        <p className="text-center text-[12px] mb-5 text-zinc-500">Join Monet for instant desk bookings & digital keys.</p>
        <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="flex flex-row gap-3">
                <div className="flex flex-col">
                    <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">First name</label>
                    <input name="fname" className=" w-full bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
                    <p id="fnameError" className="text-red-500 text-[12px] mt-1.25 mb-5 "></p>
                </div>
                <div className="flex flex-col">
                    <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Last name</label>
                    <input name="surname" className="w-full bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
                    <p id="surnameError" className="text-red-500 text-[12px] mt-1.25 mb-5"></p>
                </div>
            </div>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Username</label>
            <input name="username" className="bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <p id="usernameError" className="text-red-500 text-[12px] mt-1.25 mb-5"></p>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Email</label>
            <input type="email" name="email" className="bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <p id="emailError" className="text-red-500 text-[12px] mt-1.25 mb-5"></p>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Phone number</label>
            <input type="tel" name="phone_number" className="bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <p id="phoneNumberError" className="text-red-500 text-[12px] mt-1.25 mb-5"></p>
            <label className="text-[12px] mb-1.25 text-[#3F3F46] font-semibold">Password</label>
            <input type="password" name="password" className="bg-[#FAFAFA] outline outline-[#E4E4E7] rounded-2xl pt-2.5 pb-2.5 pl-3.5 pr-3.5 focus:bg-white focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/5 transition"/>
            <p id="passwordError" className="text-red-500 text-[12px] mt-1.25 mb-5"></p>
            <input type="submit" value="Create Account" className="bg-[#09090B] hover:bg-zinc-800 transition-all cursor-pointer text-white font-bold text-[13px] rounded-full w-94.25 h-[43.5px] mb-6.25"/>
        </form>
        <p className="text-center text-zinc-500 text-[12px] pt-3.75 border-t border-zinc-100">Already have an account?  <Link to="/login" className="font-bold text-black">Sign in</Link></p>
    </div>
    <Footer />
    </div>
    );
}