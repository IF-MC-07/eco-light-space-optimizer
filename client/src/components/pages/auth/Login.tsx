import React from "react";
import { LoginForm } from "../../../features/auth/components/LoginForm";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F5F7F5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Panel */}
        <div className="md:w-1/2 bg-[#F8FAFC] p-12 flex flex-col justify-center relative overflow-hidden">
          {/* Faded leaf in background */}
          <div className="absolute -right-20 -bottom-20 opacity-[0.03] pointer-events-none">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-96 h-96 text-primary">
              <path d="M11 20A7 7 0 0 1 14 6c.5 3 2.5 5 5 6a10 10 0 0 1-8 8Z" />
              <path d="M2 12a10 10 0 0 1 10-10c.5 3 2.5 5 5 6" />
              <path d="M14 6c-.5 3-2.5 5-5 6a10 10 0 0 1-7-7" />
            </svg>
          </div>

          <div className="flex items-center space-x-2 mb-16 relative z-10">
            <div className="text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-secondary-dark block leading-none">Eco-Light</span>
              <span className="text-[10px] text-primary font-semibold tracking-wider block">Space Optimizer</span>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <h1 className="font-heading text-5xl font-bold leading-tight text-secondary-dark">
              Cultivating <br/>
              <span className="text-primary">Sustainable</span><br/>
              Intelligence.
            </h1>
            <p className="text-secondary-light text-base leading-relaxed max-w-sm">
              Access your digital arboretum and optimize your energy footprint with our editorial-grade space management dashboard.
            </p>

            <div className="mt-8 bg-white/60 backdrop-blur-md border border-white p-6 rounded-xl shadow-sm max-w-sm">
              <p className="text-sm italic font-medium text-secondary-dark mb-4">
                "Efficiency is not just a metric; it's a living asset."
              </p>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                Eco-Light Philosophy
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
          <LoginForm />
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] font-bold text-secondary-light tracking-widest uppercase">
        © 2026 Eco-Light Systems. All rights reserved.
      </div>
    </div>
  );
}
