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

          <div className="flex justify-start mb-8 relative z-10">
            <img
              src="images/Logo Eco-Light.png"
              alt="Logo"
              className="w-48 h-auto"
            />
          </div>

          <div className="relative z-10 space-y-6">
            <h1 className="font-heading text-5xl font-bold leading-tight text-secondary-dark">
              Cultivating <br />
              <span className="text-primary">Sustainable</span><br />
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
