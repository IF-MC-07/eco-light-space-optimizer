import React, { useState } from "react";
import { X, Download, Calendar, Check } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";
import { serverAPI } from "../../../lib/api";
import { downloadExport } from "../../../utils/exportHelper";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType?: 'dashboard' | 'energy' | 'savings' | 'rooms' | 'users' | 'devices' | 'schedules' | 'zones';
}

export function ExportReportModal({ isOpen, onClose, reportType = 'dashboard' }: ExportReportModalProps) {
  const [format, setFormat] = useState<"PDF" | "CSV" | "EXCEL">("PDF");
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    const formatQuery = format === 'EXCEL' ? 'xlsx' as const : format.toLowerCase() as 'pdf' | 'xlsx' | 'csv';
    
    try {
      if (reportType === 'dashboard') {
        const response = await serverAPI.get('/export/dashboard-summary', {
          params: { format: formatQuery },
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard_summary.${formatQuery}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (reportType === 'energy') {
        const response = await serverAPI.get('/export/energy-logs', {
          params: { format: formatQuery },
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `energy_logs.${formatQuery}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (reportType === 'savings') {
        const response = await serverAPI.get('/export/savings-report', {
          params: { format: formatQuery },
          responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `savings_report.${formatQuery}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const resourceMap: Record<string, string> = {
          rooms: 'rooms',
          users: 'users',
          devices: 'devices',
          schedules: 'schedules',
          zones: 'zones'
        };
        const resName = resourceMap[reportType] || 'users';
        await downloadExport(resName, formatQuery);
      }
      onClose();
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

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

          <div className="bg-[#F8FAFC] rounded-xl p-4 flex space-x-3 mt-4 border border-neutral-border/40">
            <Check className="w-5 h-5 text-primary-dark mt-0.5" />
            <p className="text-xs text-secondary-light leading-relaxed">
              Exporting <strong className="text-secondary-dark capitalize">{reportType}</strong> data in <strong className="text-secondary-dark">{format}</strong> format.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-secondary-dark py-4 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <Button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-[2] bg-primary-dark hover:bg-primary text-white py-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? "Downloading..." : "Download"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
