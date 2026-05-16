"use client";
import React from "react";
import { X, Thermometer, Users, Leaf, ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { RoleGuard } from "../../../components/auth/RoleGuard";
import { useRouter } from "next/navigation";
import { Room } from "../types";

interface RoomSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export function RoomSummaryModal({
  isOpen,
  onClose,
  room
}: RoomSummaryModalProps) {
  const router = useRouter();

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <>
          <div className="px-8 pt-8 pb-6 flex justify-between items-start shrink-0">
            <div>
              <h2 className="font-heading text-2xl font-bold text-secondary-dark">{room.room_name} Summary</h2>
              <p className="text-secondary-light text-sm mt-1">
                {room.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-secondary-dark transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto overflow-x-hidden flex-1">
            <div className="px-8 flex justify-between gap-4 mb-8">
              <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
                <Thermometer className="w-5 h-5 text-primary-dark mb-3" />
                <div>
                  <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Status</p>
                  <p className="font-heading text-xl font-bold text-secondary-dark">{room.status}</p>
                </div>
              </div>
              <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
                <Users className="w-5 h-5 text-primary-dark mb-3" />
                <div>
                  <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Capacity</p>
                  <p className="font-heading text-xl font-bold text-secondary-dark">{room.capacity}</p>
                </div>
              </div>
              <div className="flex-1 bg-[#F5F7F5] rounded-xl p-4 flex flex-col justify-between">
                <Leaf className="w-5 h-5 text-primary-dark mb-3" />
                <div>
                  <p className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider mb-1">Type</p>
                  <p className="font-heading text-xl font-bold text-secondary-dark">Smart</p>
                </div>
              </div>
            </div>

            <div className="px-8 mb-6">
              <div className="bg-[#F5F7F5] rounded-xl p-4 flex items-center space-x-4">
                <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white border-4 border-primary-dark shrink-0">
                  <span className="text-xs font-bold text-secondary-dark">N/A</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">Device Efficiency</h4>
                  <p className="text-xs text-secondary-light">Detail view available in management</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 pt-4 bg-white flex flex-col items-center space-y-4 shrink-0 border-t border-neutral-border/50">
            <RoleGuard allowedRoles={['admin']}>
            <Button 
              onClick={() => {
                onClose();
                router.push(`/rooms/${room.room_id}`);
              }}
              className="w-full bg-primary-dark hover:bg-primary text-white py-6 rounded-xl flex items-center justify-center space-x-2 text-sm font-semibold transition-colors shadow-sm"
            >
              <span>Go to Room Management</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            </RoleGuard>
          </div>
        </>
      </div>
    </div>
  );
}
