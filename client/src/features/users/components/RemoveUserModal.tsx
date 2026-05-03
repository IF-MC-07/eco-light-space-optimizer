import React from "react";
import { UserMinus, Info } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface RemoveUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onConfirm?: () => void;
}

export function RemoveUserModal({ isOpen, onClose, userName = "Elena Vance", onConfirm }: RemoveUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white shadow-2xl w-full max-w-[480px] flex flex-col relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        style={{ borderRadius: '16px' }}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Top maroon border accent */}
        <div className="h-2 w-full bg-[#6B1B32]"></div>

        <div className="p-8">
          <div className="flex items-center space-x-5 mb-6">
            <div className="w-14 h-14 bg-[#F3E8EC] text-[#6B1B32] rounded-2xl flex items-center justify-center shrink-0">
              <UserMinus className="w-6 h-6" />
            </div>
            <h2 className="font-heading text-3xl font-bold text-secondary-dark">Remove User</h2>
          </div>

          <p className="text-[17px] text-secondary-dark leading-relaxed mb-8">
            Are you sure you want to remove <strong>{userName}</strong>? This action will immediately revoke their access to the campus management dashboard.
          </p>

          <div className="bg-[#F8FAFC] border-l-2 border-[#6B1B32] rounded-r-lg p-5 flex items-start space-x-3 mb-8">
            <div className="mt-0.5 text-[#6B1B32]">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#6B1B32] mb-1">This cannot be undone</h4>
              <p className="text-[13px] text-secondary-dark leading-relaxed">
                All associated activity logs will be archived for audit purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 pb-8 pt-4 bg-[#F8FAFC] flex items-center justify-end space-x-6 border-t border-neutral-border/50">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <Button 
            onClick={onConfirm}
            className="bg-[#6B1B32] hover:bg-[#501324] text-white py-3 px-8 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Remove User
          </Button>
        </div>
      </div>
    </div>
  );
}
