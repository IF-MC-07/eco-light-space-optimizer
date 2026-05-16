"use client";
import React, { useState, useEffect } from "react";
import { X, MapPin, Users, DoorOpen, Activity } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useUpdateRoom } from "../hooks";
import { Room, RoomStatus } from "../types";
import { cn } from "../../../lib/utils";

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
}

export function EditRoomModal({ isOpen, onClose, room }: EditRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [status, setStatus] = useState<RoomStatus>(RoomStatus.ACTIVE);

  const { mutate: updateRoom, isPending } = useUpdateRoom();

  useEffect(() => {
    if (room) {
      setRoomName(room.room_name);
      setLocation(room.location);
      setCapacity(room.capacity?.toString() || "30");
      setStatus(room.status);
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoom(
      { 
        id: room.room_id,
        payload: {
          room_name: roomName, 
          location, 
          capacity: parseInt(capacity),
          status
        }
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center text-white shadow-md">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-secondary-dark tracking-tight">Edit Room</h2>
                <p className="text-secondary-light text-sm">Update room configuration & status</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-secondary-dark hover:bg-[#E2E8F0] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Selector */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Room Status
              </label>
              <div className="flex gap-2">
                {[RoomStatus.ACTIVE, RoomStatus.INACTIVE, RoomStatus.MAINTENANCE].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border",
                      status === s 
                        ? "bg-primary-dark text-white border-primary-dark shadow-md" 
                        : "bg-[#F8FAFC] text-secondary border-transparent hover:bg-[#F1F5F9]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest flex items-center gap-2">
                <DoorOpen className="w-3 h-3" />
                Room Name
              </label>
              <input 
                type="text" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Room 302 or Meeting Center"
                className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark placeholder:text-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 px-5 py-4 transition-all"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                Location
              </label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Building A, Floor 3"
                className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark placeholder:text-secondary-light/50 focus:outline-none focus:ring-2 focus:ring-primary/50 px-5 py-4 transition-all"
                required
              />
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3" />
                Max Capacity
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-5 py-4"
                  min="1"
                  required
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary-light text-xs font-bold uppercase">People</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-3">
              <Button 
                type="submit"
                disabled={isPending}
                className="w-full bg-primary-dark hover:bg-primary text-white py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-primary-dark/20 flex items-center justify-center gap-2"
              >
                {isPending ? "Saving Changes..." : "Save Changes"}
              </Button>
              <button 
                type="button"
                onClick={onClose}
                className="text-sm font-bold text-secondary hover:text-secondary-dark transition-colors py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
