import React from "react";
import { RegisterForm } from "../../../features/auth/components/RegisterForm";

export default function Register() {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      {/* Background gradient corresponding to the wireframe */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E8F5E9]/60 via-[#F8FAFC] to-[#F1F5F9] z-0"></div>
      
      <div className="relative z-10 w-full max-w-lg bg-white p-10 md:p-12 rounded-2xl shadow-xl border border-white/50">
        <RegisterForm />
      </div>

      <div className="relative z-10 mt-8 text-center text-[10px] font-bold text-secondary-light tracking-widest uppercase">
        SECURE ENVIRONMENT ENABLED • AES-256 ENCRYPTION
      </div>
    </div>
  );
}
