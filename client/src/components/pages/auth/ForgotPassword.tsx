import React from "react";
import { ForgotPasswordForm } from "../../../features/auth/components/ForgotPasswordForm";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* Very faint background pattern / gradient per wireframe */}
      <div className="absolute inset-0 bg-[#F8FAFC] z-0 overflow-hidden flex flex-col">
        <div className="h-2/3 w-full"></div>
        <div className="h-1/3 w-full bg-gradient-to-t from-gray-200/40 to-transparent flex items-end justify-center pb-0">
           {/* Faint leaf at bottom */}
           <svg viewBox="0 0 24 24" fill="currentColor" className="w-[800px] h-[800px] text-gray-200/20 translate-y-1/2">
             <path d="M11 20A7 7 0 0 1 14 6c.5 3 2.5 5 5 6a10 10 0 0 1-8 8Z" />
             <path d="M2 12a10 10 0 0 1 10-10c.5 3 2.5 5 5 6" />
             <path d="M14 6c-.5 3-2.5 5-5 6a10 10 0 0 1-7-7" />
           </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white p-10 md:p-12 rounded-2xl shadow-xl shadow-black/5 border border-white/50">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
