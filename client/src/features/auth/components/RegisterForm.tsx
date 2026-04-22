import React, { useState } from "react";
import { User, Mail, Building, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary-light/20 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M11 20A7 7 0 0 1 14 6c.5 3 2.5 5 5 6a10 10 0 0 1-8 8Z" />
            <path d="M2 12a10 10 0 0 1 10-10c.5 3 2.5 5 5 6" />
            <path d="M14 6c-.5 3-2.5 5-5 6a10 10 0 0 1-7-7" />
          </svg>
        </div>
        <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-2">Create Account</h2>
        <p className="text-secondary-light text-sm">
          Join the Digital Arboretum and optimize your workspace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <Input
          label="FULL NAME"
          type="text"
          placeholder="John Doe"
          leftIcon={<User className="w-4 h-4" />}
        />

        <Input
          label="EMAIL ADDRESS"
          type="email"
          placeholder="john@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <div className="w-full flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-secondary-dark uppercase">Department</label>
          <div className="relative flex items-center w-full">
            <div className="absolute left-3 text-secondary-light flex items-center pointer-events-none">
              <Building className="w-4 h-4" />
            </div>
            <select className="w-full bg-[#E2E8F0] bg-opacity-40 border-none rounded-md text-sm text-secondary-dark focus:outline-none focus:ring-1 focus:ring-primary appearance-none pl-10 pr-10 py-3 cursor-pointer">
              <option value="" disabled selected>Select Department</option>
              <option value="engineering">Engineering</option>
              <option value="hr">Human Resources</option>
              <option value="facilities">Facilities Management</option>
            </select>
            <div className="absolute right-3 text-secondary-light flex items-center pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="PASSWORD"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <Input
            label="CONFIRM PASSWORD"
            type="password"
            placeholder="••••••••"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <div className="mt-0.5">
            <Checkbox id="terms" />
          </div>
          <label htmlFor="terms" className="text-xs font-medium text-secondary-light leading-snug cursor-pointer">
            I agree to the <a href="#" className="font-bold text-primary hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-primary hover:underline">Privacy Policy</a> regarding energy usage data.
          </label>
        </div>

        <Button className="w-full bg-primary hover:bg-primary-dark text-white py-6 text-sm rounded-md shadow-sm transition-all mt-6 flex items-center justify-center space-x-2">
          <span>Create Account</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <p className="text-center text-sm font-medium text-secondary-light mt-8">
        Already have an account?{" "}
        <a href="#" className="font-bold text-primary hover:text-primary-dark transition-colors">
          Sign In
        </a>
      </p>
    </div>
  );
}
