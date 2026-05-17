"use client";
import React from "react";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId?: string;
  isAddingNew?: boolean;
}

export function EditScheduleModal({ isOpen }: EditScheduleModalProps) {
  if (!isOpen) return null;
  return <div>Legacy Modal</div>;
}
