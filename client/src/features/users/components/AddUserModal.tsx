import React, { useState } from "react";
import { X, Shield, Eye, Edit as EditIcon } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white shadow-2xl w-full max-w-[600px] flex flex-col p-10 relative animate-in fade-in zoom-in-95 duration-200"
        style={{ borderRadius: '24px' }} // Slightly less rounded than others based on wireframe
        role="dialog"
        aria-modal="true"
      >
        {/* Bottom decorative accent line */}
        <div className="absolute bottom-0 left-0 h-1 bg-[#86EFAC] w-[40%] rounded-bl-3xl"></div>
        <div className="absolute bottom-0 left-[40%] h-1 bg-[#E2E8F0] w-[60%] rounded-br-3xl"></div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-secondary-dark mb-2">Add New User</h2>
            <p className="text-secondary-light text-sm">Provision access to the Digital Arboretum ecosystem.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary-dark hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                placeholder="E.g. Julian Thorne"
                className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                placeholder="julian.t@ecolight.com"
                className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Department</label>
            <div className="relative">
              <select className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5 appearance-none cursor-pointer">
                <option value="" disabled selected>Select Department</option>
                <option value="sustainability">Sustainability</option>
                <option value="operations">Operations</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Role */}
        <div className="mb-12">
          <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest block mb-4">Assign Role</label>
          <div className="grid grid-cols-3 gap-4">
            {/* Admin */}
            <div 
              onClick={() => setRole("admin")}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                role === "admin" ? "bg-primary-dark text-white shadow-md" : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-secondary-dark"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5" />
                <h4 className="font-bold">Admin</h4>
              </div>
              <p className={cn("text-[10px]", role === "admin" ? "text-white/80" : "text-secondary-light")}>Full system control.</p>
            </div>

            {/* Editor */}
            <div 
              onClick={() => setRole("editor")}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                role === "editor" ? "bg-primary-dark text-white shadow-md" : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-secondary-dark"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <EditIcon className="w-5 h-5" />
                <h4 className="font-bold">Editor</h4>
              </div>
              <p className={cn("text-[10px]", role === "editor" ? "text-primary" : "text-secondary-light")}>Can manage devices.</p>
            </div>

            {/* Viewer */}
            <div 
              onClick={() => setRole("viewer")}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                role === "viewer" ? "bg-primary-dark text-white shadow-md" : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-secondary-dark"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-5 h-5" />
                <h4 className="font-bold">Viewer</h4>
              </div>
              <p className={cn("text-[10px]", role === "viewer" ? "text-white/80" : "text-secondary-light")}>Read-only analytics.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-6 pb-2">
          <button onClick={onClose} className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors">
            Cancel
          </button>
          <Button className="bg-primary-dark hover:bg-primary text-white py-3 px-8 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            Add User
          </Button>
        </div>

      </div>
    </div>
  );
}
