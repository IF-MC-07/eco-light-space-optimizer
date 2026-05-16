"use client";
import React, { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useUpdateSchedule, useCreateSchedule } from "../hooks";
import { AutomationSchedule } from "../types";
import { useMe } from "../../auth/hooks";
import { useRooms } from "../../rooms/hooks";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: AutomationSchedule | null;
  isAddingNew?: boolean;
}

export function EditScheduleModal({ isOpen, onClose, schedule, isAddingNew = false }: EditScheduleModalProps) {
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateSchedule();
  const { mutate: createSchedule, isPending: isCreating } = useCreateSchedule();
  const { data: meResponse } = useMe();
  const me = meResponse?.data;
  const { data: roomsResponse } = useRooms();
  const rooms = roomsResponse?.data || [];

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [roomId, setRoomId] = useState<string>("");

  useEffect(() => {
    if (schedule) {
      setName(schedule.schedule_name || "");
      setStartTime(schedule.start_time || "08:00");
      setEndTime(schedule.end_time || "17:00");
      
      if (schedule.room_id) {
        setRoomId(schedule.room_id);
      } else if (rooms.length > 0) {
        setRoomId(rooms[0].room_id);
      }
    }
  }, [schedule, isOpen, rooms]);

  if (!isOpen || !schedule) return null;

  const handleSave = () => {
    const payload = {
      schedule_name: name,
      start_time: startTime,
      end_time: endTime,
      room_id: roomId,
      user_id: me?.user_id || "", // Use actual user_id from me hook
    };

    if (isAddingNew) {
      createSchedule(payload, { onSuccess: () => onClose() });
    } else {
      updateSchedule(
        { id: schedule.schedule_id, payload },
        { onSuccess: () => onClose() }
      );
    }
  };

  const isSaving = isUpdating || isCreating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-primary-dark uppercase tracking-widest bg-[#D1FAE5] px-3 py-1.5 rounded-full">
              {isAddingNew ? "New Automation" : "Automation Detail"}
            </span>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-secondary-dark hover:bg-[#E2E8F0] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-secondary-dark">
              {isAddingNew ? "Add Schedule" : "Edit Schedule"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Schedule Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g. Morning Ambience"
                className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Start Time</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">End Time</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 pl-4 pr-10 py-3.5"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest">Select Room</label>
              {rooms.length > 0 ? (
                <select 
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-[#F1F5F9] border-none rounded-xl text-base font-semibold text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-3.5 appearance-none cursor-pointer"
                >
                  {rooms.map((room: any) => (
                    <option key={room.room_id} value={room.room_id}>
                      {room.room_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-red-500 font-bold p-2 bg-red-50 rounded-lg">
                  No rooms available. Please create a room first.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 bg-[#F8FAFC] flex flex-col items-center pt-8 border-t border-neutral-border/50">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary-dark hover:bg-primary text-white py-4 rounded-xl text-base font-semibold transition-colors shadow-sm mb-4"
          >
            {isSaving ? "Saving..." : isAddingNew ? "Create Schedule" : "Update Schedule"}
          </Button>
          <button 
            onClick={onClose}
            className="text-sm font-bold text-secondary-dark hover:text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
