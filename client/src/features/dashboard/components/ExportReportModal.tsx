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

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ExportReportModal({ isOpen, onClose, reportType = 'dashboard' }: ExportReportModalProps) {
  const [format, setFormat] = useState<"PDF" | "CSV" | "EXCEL">("PDF");
  const [isDownloading, setIsDownloading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const todayStr = toLocalISODate(new Date());

  // Default: last 7 days → today
  const defaultFrom = toLocalISODate(new Date(Date.now() - 6 * 86400000));
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo]     = useState(todayStr);

  if (!isOpen) return null;

  const handleDateFromChange = (val: string) => {
    setDateError(null);
    setDateFrom(val);
    // if start > end, clamp end to start
    if (val > dateTo) setDateTo(val);
  };

  const handleDateToChange = (val: string) => {
    setDateError(null);
    if (val > todayStr) {
      setDateError("End date cannot be in the future.");
      return;
    }
    if (val < dateFrom) {
      setDateError("End date cannot be earlier than start date.");
      return;
    }
    setDateTo(val);
  };

  const handleDownload = async () => {
    if (dateFrom > dateTo) {
      setDateError("Start date cannot be after end date.");
      return;
    }
    if (dateTo > todayStr) {
      setDateError("End date cannot be in the future.");
      return;
    }

    setIsDownloading(true);
    const formatQuery = format === 'EXCEL' ? 'xlsx' as const : format.toLowerCase() as 'pdf' | 'xlsx' | 'csv';
    
    const dateParams = { format: formatQuery, dateFrom, dateTo };

    const downloadBlob = async (url: string, filename: string) => {
      const response = await serverAPI.get(url, {
        params: dateParams,
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    };

    try {
      if (reportType === 'dashboard') {
        await downloadBlob('/export/dashboard-summary', `dashboard_summary_${dateFrom}_${dateTo}.${formatQuery}`);
      } else if (reportType === 'energy') {
        await downloadBlob('/export/energy-logs', `energy_logs_${dateFrom}_${dateTo}.${formatQuery}`);
      } else if (reportType === 'savings') {
        await downloadBlob('/export/savings-report', `savings_report_${dateFrom}_${dateTo}.${formatQuery}`);
      } else {
        const resourceMap: Record<string, string> = {
          rooms: 'rooms', users: 'users', devices: 'devices',
          schedules: 'schedules', zones: 'zones'
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[460px] overflow-hidden flex flex-col p-8 relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-7">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#86EFAC] text-primary-dark rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-secondary-dark">Export Report</h2>
              <p className="text-xs text-secondary-light font-medium capitalize mt-0.5">{reportType} data</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary-dark hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
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
            <label className="text-[11px] font-bold text-secondary-dark uppercase tracking-widest block mb-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-secondary-light uppercase tracking-wider">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  max={todayStr}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full bg-[#F1F5F9] border-2 border-transparent focus:border-primary-dark focus:bg-white rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-dark outline-none transition-all cursor-pointer"
                />
              </div>
              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-secondary-light uppercase tracking-wider">To</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  max={todayStr}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full bg-[#F1F5F9] border-2 border-transparent focus:border-primary-dark focus:bg-white rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-dark outline-none transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Date Error */}
            {dateError && (
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="shrink-0">⚠</span>
                {dateError}
              </div>
            )}

            {/* Quick range chips */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                { label: 'Today', days: 0 },
                { label: 'Last 7d', days: 6 },
                { label: 'Last 30d', days: 29 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setDateError(null);
                    const from = toLocalISODate(new Date(Date.now() - days * 86400000));
                    setDateFrom(from);
                    setDateTo(todayStr);
                  }}
                  className="px-3 py-1 text-[11px] font-bold rounded-full bg-[#F1F5F9] text-secondary-dark hover:bg-[#E2E8F0] transition-colors border border-transparent hover:border-primary/30"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 flex space-x-3 border border-neutral-border/40">
            <Check className="w-5 h-5 text-primary-dark mt-0.5 shrink-0" />
            <p className="text-xs text-secondary-light leading-relaxed">
              Exporting <strong className="text-secondary-dark capitalize">{reportType}</strong> data in{' '}
              <strong className="text-secondary-dark">{format}</strong> format from{' '}
              <strong className="text-secondary-dark">{dateFrom}</strong> to{' '}
              <strong className="text-secondary-dark">{dateTo}</strong>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 mt-7">
          <button 
            onClick={onClose}
            className="flex-1 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-secondary-dark py-4 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <Button 
            onClick={handleDownload}
            disabled={isDownloading || !!dateError}
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
