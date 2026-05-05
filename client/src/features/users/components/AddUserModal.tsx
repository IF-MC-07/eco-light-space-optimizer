import React, { useState } from "react";
import { X, Shield, Eye, Edit as EditIcon } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { useCreateUser } from "../hooks";
import { UserRole } from "../types";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<UserRole | string>(UserRole.MANAGER);

  const { mutate: createUser, isPending, isLoading, error } = useCreateUser();
  const loading = isPending || isLoading;

  if (!isOpen) return null;

  const handleSubmit = () => {
    createUser(
      { name, email, department, role },
      {
        onSuccess: () => {
          onClose();
          // Reset form
          setName("");
          setEmail("");
          setDepartment("");
          setRole(UserRole.MANAGER);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white shadow-2xl w-full max-w-[600px] flex flex-col p-10 relative animate-in fade-in zoom-in-95 duration-200"
        style={{ borderRadius: '24px' }}
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

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
            Error creating user. Please try again.
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Julian Thorne"
                className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="julian.t@ecolight.com"
                className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Department</label>
            <div className="relative">
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#E2E8F0] bg-opacity-60 border-none rounded-lg text-base text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5 appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Department</option>
                <option value="sustainability">Sustainability</option>
                <option value="operations">Operations</option>
                <option value="maintenance">Maintenance</option>
                <option value="it">Campus IT</option>
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
              onClick={() => setRole(UserRole.ADMIN)}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                role === UserRole.ADMIN ? "bg-primary-dark text-white shadow-md" : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-secondary-dark"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5" />
                <h4 className="font-bold">Admin</h4>
              </div>
              <p className={cn("text-[10px]", role === UserRole.ADMIN ? "text-white/80" : "text-secondary-light")}>Full system control.</p>
            </div>

            {/* Manager/Editor */}
            <div 
              onClick={() => setRole(UserRole.MANAGER)}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                role === UserRole.MANAGER ? "bg-primary-dark text-white shadow-md" : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-secondary-dark"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <EditIcon className="w-5 h-5" />
                <h4 className="font-bold">Manager</h4>
              </div>
              <p className={cn("text-[10px]", role === UserRole.MANAGER ? "text-primary" : "text-secondary-light")}>Can manage devices.</p>
            </div>

            {/* Viewer */}
            <div 
              onClick={() => setRole(UserRole.VIEWER)}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border border-transparent",
                role === UserRole.VIEWER ? "bg-primary-dark text-white shadow-md" : "bg-[#F8FAFC] hover:bg-[#F1F5F9] text-secondary-dark"
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-5 h-5" />
                <h4 className="font-bold">Viewer</h4>
              </div>
              <p className={cn("text-[10px]", role === UserRole.VIEWER ? "text-white/80" : "text-secondary-light")}>Read-only analytics.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-6 pb-2">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !name || !email}
            className="bg-primary-dark hover:bg-primary text-white py-3 px-8 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add User"}
          </Button>
        </div>

      </div>
    </div>
  );
}
