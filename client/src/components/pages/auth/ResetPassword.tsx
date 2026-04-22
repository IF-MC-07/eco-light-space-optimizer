import React from "react";
import { ResetPasswordForm } from "../../../features/auth/components/ResetPasswordForm";

export default function ResetPassword() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* Background gradient corresponding to the wireframe */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9]/60 via-[#F8FAFC] to-[#F1F5F9] z-0"></div>
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-primary-dark rounded-xl flex items-center justify-center text-white mb-4 shadow-md">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M11 20A7 7 0 0 1 14 6c.5 3 2.5 5 5 6a10 10 0 0 1-8 8Z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-bold text-secondary-dark text-center">
          Eco-Light & Space Optimizer
        </h1>
        <p className="text-secondary-light text-sm font-medium mt-1">
          Digital Arboretum Security
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white p-10 md:p-12 rounded-2xl shadow-xl shadow-black/5 border border-white/50">
        <ResetPasswordForm />
      </div>

      <div className="relative z-10 mt-8 text-center text-[10px] font-bold text-secondary-light tracking-widest uppercase">
        SECURE ENVIRONMENT ENABLED • AES-256 ENCRYPTION
      </div>
    </div>
  );
}
