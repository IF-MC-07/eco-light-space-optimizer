import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Continue",
}: AlertDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-[400px] overflow-hidden flex flex-col p-8 relative animate-in fade-in zoom-in-95 duration-200 border border-white"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-tertiary-light/20 text-tertiary rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-secondary-dark">{title}</h2>
        </div>

        <div className="text-secondary-dark text-[15px] leading-relaxed mb-8 font-medium">
          {description}
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors px-4 py-2"
          >
            {cancelText}
          </button>
          <Button 
            onClick={onConfirm}
            className="bg-[#B91C1C] hover:bg-[#991B1B] text-white py-2.5 px-6 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
