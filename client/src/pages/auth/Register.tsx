import React from 'react';
import { Mail, User, Building, Lock, ShieldCheck, ArrowRight, ChevronDown, Leaf } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9]/50 via-[#F8FAFC] to-[#E3F2FD]/40 flex flex-col items-center justify-center p-4">
      
      <div className="bg-white rounded-xl shadow-elevated p-10 max-w-[500px] w-full text-center relative z-10 border border-white">
        
        <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-[#4CAF50] mx-auto mb-5 shadow-sm">
           <Leaf size={24} strokeWidth={2.5}/>
        </div>

        <h1 className="text-3xl font-heading font-extrabold text-neutral-900 mb-2">Create Account</h1>
        <p className="text-secondary text-sm mb-8 tracking-wide">
          Join the Digital Arboretum and optimize your workspace.
        </p>

        <form className="space-y-5 text-left" onSubmit={(e) => e.preventDefault()}>
          
          <Input 
            label="FULL NAME"
            type="text"
            placeholder="John Doe"
            leftIcon={<User size={18} />}
          />

          <Input 
            label="EMAIL ADDRESS"
            type="email"
            placeholder="john@example.com"
            leftIcon={<Mail size={18} />}
          />

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-secondary-dark uppercase text-[10px] tracking-wider">DEPARTMENT</label>
            <div className="relative flex items-center w-full">
              <div className="absolute left-3 text-secondary-light flex items-center">
                <Building size={18} />
              </div>
              <select className="w-full bg-[#E2E8F0] bg-opacity-40 border-none rounded-md text-sm text-secondary-dark focus:outline-none focus:ring-1 focus:ring-primary appearance-none pl-10 pr-10 py-3 font-medium">
                <option value="">Select Department</option>
                <option value="hr">Human Resources</option>
                <option value="eng">Engineering</option>
                <option value="ops">Operations</option>
              </select>
              <div className="absolute right-3 text-secondary-light flex items-center pointer-events-none">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="PASSWORD"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={18} />}
            />
            <Input 
              label="CONFIRM PASSWORD"
              type="password"
              placeholder="••••••••"
              leftIcon={<ShieldCheck size={18} />}
            />
          </div>

          <div className="flex items-start gap-3 mt-6 mb-8 bg-transparent pt-2">
            <div className="mt-0.5">
              <Checkbox id="terms" />
            </div>
            <label htmlFor="terms" className="text-xs text-secondary leading-relaxed cursor-pointer">
              I agree to the <span className="text-[#1B4D1E] font-bold">Terms of Service</span> and <span className="text-[#1B4D1E] font-bold">Privacy Policy</span> regarding energy usage data.
            </label>
          </div>

          <Button variant="primary" fullWidth className="py-3.5 shadow-md text-sm font-bold flex justify-center gap-2 items-center bg-[#0A3A17] hover:bg-[#1B4D1E]">
            Create Account <ArrowRight size={18} />
          </Button>

          <div className="text-center mt-6">
             <span className="text-secondary text-sm">Already have an account? </span>
             <a href="#" className="font-bold text-[#1B4D1E] hover:underline text-sm ml-1">Sign In</a>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center">
         <p className="text-[9px] font-bold text-secondary-light tracking-[0.2em] uppercase">
            Secure Environment Enabled • AES-256 Encryption
         </p>
      </div>
    </div>
  );
}
