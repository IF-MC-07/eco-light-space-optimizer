import React, { useState } from "react";
import { X, Pencil, Shield, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserModal({ isOpen, onClose }: EditUserModalProps) {
  const [role, setRole] = useState<"admin" | "student">("admin");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[540px] overflow-hidden flex flex-col p-8 md:p-10 relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-heading text-2xl font-bold text-secondary-dark mb-1">Edit User</h2>
            <p className="text-secondary-light text-sm">Update employee details and system access permissions.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary-dark hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary-dark">
              {/* Fallback to initials if no image is available, but mock an image here */}
              <div className="w-full h-full bg-secondary-dark flex items-center justify-center text-white font-bold text-xl">
                EV
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary-dark text-white rounded-full flex items-center justify-center shadow-sm border-2 border-white hover:bg-primary transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-secondary-dark mb-1">Elena Vance</h3>
            <p className="text-sm text-secondary-light mb-2">elena.vance@ecolight.io</p>
            <span className="text-[10px] font-bold text-primary-dark uppercase tracking-widest bg-[#86EFAC] px-2 py-1 rounded">
              Active Account
            </span>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                defaultValue="Elena Vance"
                className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                defaultValue="elena.vance@ecolight.io"
                className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Department</label>
            <div className="relative">
              <select className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5 appearance-none cursor-pointer">
                <option value="sustainability">Sustainability</option>
                <option value="operations">Operations</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <label className="text-[13px] font-bold text-secondary-dark">Access Role Assignment</label>
            <a href="#" className="text-[11px] font-bold text-primary-dark hover:underline">Permissions Required</a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Admin Card */}
            <div 
              onClick={() => setRole("admin")}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border-2 relative flex flex-col",
                role === "admin" 
                  ? "border-primary-dark bg-[#F5F7F5]" 
                  : "border-transparent bg-[#F8FAFC] hover:bg-[#F1F5F9]"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-[#bbf7d0] text-primary-dark flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-secondary-dark mb-1">Admin</h4>
              <p className="text-[11px] text-secondary-light leading-relaxed">Full control over all system settings and users.</p>
              {role === "admin" && (
                <CheckCircle2 className="w-5 h-5 text-primary-dark absolute top-4 right-4 fill-primary-dark/20" />
              )}
            </div>

            {/* Student Card */}
            <div 
              onClick={() => setRole("student")}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border-2 relative flex flex-col",
                role === "student" 
                  ? "border-primary-dark bg-[#F5F7F5]" 
                  : "border-transparent bg-[#F8FAFC] hover:bg-[#F1F5F9]"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-[#E2E8F0] text-secondary-dark flex items-center justify-center mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-secondary-dark mb-1">Student</h4>
              <p className="text-[11px] text-secondary-light leading-relaxed">Read-only access to monitoring metrics and logs.</p>
              {role === "student" && (
                <CheckCircle2 className="w-5 h-5 text-primary-dark absolute top-4 right-4 fill-primary-dark/20" />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4">
          <button onClick={onClose} className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors">
            Cancel
          </button>
          <div className="flex space-x-4">
            <button className="bg-[#E2E8F0] hover:bg-[#CBD5E1] text-secondary-dark py-3 px-6 rounded-lg text-sm font-bold transition-colors">
              Reset Defaults
            </button>
            <Button className="bg-primary-dark hover:bg-primary text-white py-3 px-6 rounded-lg text-sm font-semibold transition-colors shadow-sm">
              Save Changes
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
