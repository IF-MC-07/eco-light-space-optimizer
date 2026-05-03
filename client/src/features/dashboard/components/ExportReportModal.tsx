import React, { useState } from "react";
import { X, Download, Calendar, Check } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportReportModal({ isOpen, onClose }: ExportReportModalProps) {
  const [format, setFormat] = useState<"PDF" | "CSV" | "EXCEL">("PDF");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRoomBreakdown, setIncludeRoomBreakdown] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col p-8 relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#86EFAC] text-primary-dark rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-secondary-dark">Export Report</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary-dark hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Format */}
          <div>
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest block mb-3">Format</label>
            <div className="grid grid-cols-3 gap-3">
              {(["PDF", "CSV", "EXCEL"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "py-3 rounded-lg text-sm font-bold transition-all border-2",
                    format === f 
                      ? "border-primary-dark bg-[#F0FDF4] text-primary-dark" 
                      : "border-transparent bg-[#F1F5F9] text-secondary-dark hover:bg-[#E2E8F0]"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest block mb-3">Date Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] text-secondary-dark font-semibold">Start Date</span>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    defaultValue="Aug 01, 2023"
                    className="w-full bg-[#E2E8F0] border-none rounded-lg text-sm font-semibold text-secondary-dark focus:outline-none pl-10 pr-4 py-3"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-secondary-dark font-semibold">End Date</span>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-dark">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    defaultValue="Aug 31, 2023"
                    className="w-full bg-[#E2E8F0] border-none rounded-lg text-sm font-semibold text-secondary-dark focus:outline-none pl-10 pr-4 py-3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inclusions */}
          <div>
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest block mb-3">Inclusions</label>
            <div className="space-y-3">
              {/* Checkbox 1 */}
              <div 
                className="bg-[#F8FAFC] rounded-xl p-4 flex items-start space-x-4 cursor-pointer"
                onClick={() => setIncludeCharts(!includeCharts)}
              >
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5",
                  includeCharts ? "bg-primary-dark border-primary-dark" : "border-[#CBD5E1] bg-white"
                )}>
                  {includeCharts && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">Include Charts</h4>
                  <p className="text-xs text-secondary-light">High-resolution visualizations and vitality meters</p>
                </div>
              </div>

              {/* Checkbox 2 */}
              <div 
                className="bg-[#F8FAFC] rounded-xl p-4 flex items-start space-x-4 cursor-pointer"
                onClick={() => setIncludeRoomBreakdown(!includeRoomBreakdown)}
              >
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5",
                  includeRoomBreakdown ? "bg-primary-dark border-primary-dark" : "border-[#CBD5E1] bg-white"
                )}>
                  {includeRoomBreakdown && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary-dark">Include Room Breakdown</h4>
                  <p className="text-xs text-secondary-light">Granular data for individual sectors and rooms</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center space-x-4 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-secondary-dark py-4 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <Button className="flex-[2] bg-primary-dark hover:bg-primary text-white py-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
