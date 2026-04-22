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
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
        <span className="font-heading font-bold text-primary-dark">Sustained Pulse</span>
        <button className="w-8 h-8 rounded-full border border-secondary-light/30 flex items-center justify-center text-secondary-light hover:text-secondary-dark transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white p-10 md:p-12 rounded-2xl shadow-xl shadow-black/5 border border-white/50">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
