import React from 'react';
import { Eye, ArrowLeft, Leaf, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

export default function ResetPassword() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F8F6] to-[#E8F5E9]/30 flex flex-col items-center justify-center p-4">

      <div className="mb-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-[#0A2612] rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shrink-0">
          <Leaf size={22} strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-neutral-900 leading-tight">Eco-Light & Space Optimizer</h1>
        <p className="text-secondary text-xs mt-1 font-medium tracking-wide">Digital Arboretum Security</p>
      </div>

      <div className="bg-white rounded-xl shadow-elevated p-8 max-w-[420px] w-full text-center relative z-10 border border-white">

        <h2 className="text-2xl font-heading font-extrabold text-neutral-900 mb-2 text-left">Reset Password</h2>
        <p className="text-secondary text-sm mb-8 tracking-wide text-left leading-relaxed">
          Choose a strong, unique password to secure your energy management ecosystem.
        </p>

        <form className="space-y-5 text-left" onSubmit={(e) => e.preventDefault()}>

          <Input
            label="NEW PASSWORD"
            type="password"
            placeholder="••••••••••••"
            rightIcon={<Eye size={18} />}
          />

          <Input
            label="CONFIRM NEW PASSWORD"
            type="password"
            placeholder="••••••••••••"
          />

          <div className="bg-[#F8FAFC] rounded-lg p-5 border border-neutral-border/50 mt-2">
            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-4">SECURITY STANDARDS</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-xs font-semibold text-secondary-dark">
                <CheckCircle2 size={16} className="text-[#4CAF50] fill-[#E8F5E9]" />
                At least 8 characters long
              </li>
              <li className="flex items-center gap-3 text-xs font-medium text-secondary">
                <Circle size={16} className="text-secondary-light" />
                Contains an uppercase letter
              </li>
              <li className="flex items-center gap-3 text-xs font-medium text-secondary">
                <Circle size={16} className="text-secondary-light" />
                Contains a lowercase letter
              </li>
              <li className="flex items-center gap-3 text-xs font-medium text-secondary">
                <Circle size={16} className="text-secondary-light" />
                Number or special character
              </li>
            </ul>
          </div>

          <Button variant="primary" fullWidth className="py-3.5 shadow-md text-sm font-bold flex justify-center mt-6 bg-[#0A3A17] hover:bg-[#1B4D1E]">
            Reset Password
          </Button>

          <div className="text-center mt-8">
            <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-[#1B4D1E] hover:text-primary transition-colors">
              <ArrowLeft size={16} /> Back to Security Login
            </a>
          </div>
        </form>
      </div>

      <div className="mt-10 text-center">
        <p className="text-[9px] font-bold text-secondary-light tracking-[0.2em] uppercase">
          Secure Environment Enabled • AES-256 Encryption
        </p>
      </div>
    </div>
  );
}
