"use client";
import React, { useState } from "react";
import { X, MapPin, Users, DoorOpen } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useCreateRoom } from "../hooks";
import { RoomStatus } from "../types";

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRoomModal({ isOpen, onClose }: AddRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [status, setStatus] = useState<RoomStatus>(RoomStatus.ACTIVE);

  const { mutate: createRoom, isPending } = useCreateRoom();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoom(
      { 
        room_name: roomName, 
        location, 
        capacity: parseInt(capacity),
        status
      },
      {
        onSuccess: () => {
          onClose();
          setRoomName("");
          setLocation("");
          setCapacity("30");
          setStatus(RoomStatus.ACTIVE);
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
        <div className="p-8 pb-4">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center text-white shadow-md">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-heading text-bold text-secondary-dark tracking-tight">Add New Room</h2>
                <p className="text-secondary-light text-sm">Provision a new smart workspace</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Capacity
                </label>
                <input 
                  type="number" 
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-5 py-4"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest flex items-center gap-2">
                  <DoorOpen className="w-3 h-3" />
                  Status
                </label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RoomStatus)}
                  className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-5 py-4 appearance-none cursor-pointer"
                >
                  {Object.values(RoomStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Button 
                type="submit"
                disabled={isPending}
                className="w-full bg-primary-dark hover:bg-primary text-white py-4 rounded-xl text-base font-semibold transition-all shadow-lg shadow-primary-dark/20 flex items-center justify-center gap-2"
              >
                {isPending ? "Creating Room..." : "Create New Room"}
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
