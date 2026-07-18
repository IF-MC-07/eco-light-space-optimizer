"use client";
import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Moon, Briefcase, Sun, BookOpen, Coffee, Zap, Check } from 'lucide-react';
import { useCreateSchedule } from '../hooks';
import { useRooms } from '../../rooms/hooks';

const CAMPUS_TEMPLATES = [
  {
    id: 'morning-class',
    name: 'Morning Class Session',
    icon: Sun,
    color: '#F59E0B',
    startTime: '06:00:00',
    endTime: '11:00:00',
    description: 'Lights & AC on during morning lectures (06:00–11:00). Optimal for early classes.',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  },
  {
    id: 'afternoon-class',
    name: 'Afternoon Class Session',
    icon: BookOpen,
    color: '#3B82F6',
    startTime: '11:00:00',
    endTime: '16:00:00',
    description: 'Maintains comfortable lighting for afternoon academic sessions (11:00–16:00).',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  },
  {
    id: 'evening-class',
    name: 'Evening Class Session',
    icon: Moon,
    color: '#6366F1',
    startTime: '16:00:00',
    endTime: '21:00:00',
    description: 'Supports late-afternoon and evening class activities (16:00–21:00).',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  },
  {
    id: 'fullday',
    name: 'Full Campus Day',
    icon: Zap,
    color: '#10B981',
    startTime: '06:00:00',
    endTime: '23:00:00',
    description: 'Full operating hours for high-activity days from opening to close (06:00–23:00).',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  },
  {
    id: 'weekend-study',
    name: 'Weekend Study Hours',
    icon: Coffee,
    color: '#8B5CF6',
    startTime: '08:00:00',
    endTime: '17:00:00',
    description: 'Reduced weekend schedule for self-study rooms or labs (08:00–17:00).',
    days: ['SAT'],
  },
  {
    id: 'night-security',
    name: 'Night Security Mode',
    icon: Briefcase,
    color: '#64748B',
    startTime: '21:00:00',
    endTime: '23:00:00',
    description: 'Minimal lighting for security rounds after closing (21:00–23:00).',
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  },
];

const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface RecommendedTemplatesProps {
  onTemplateDeployed?: () => void;
}

export function RecommendedTemplates({ onTemplateDeployed }: RecommendedTemplatesProps) {
  const { mutateAsync: createSchedule } = useCreateSchedule();
  const { data: roomsRes } = useRooms();
  const rooms = (roomsRes?.data || []) as any[];

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectTemplate = (templateId: string) => {
    const tpl = CAMPUS_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplate(templateId);
    setSelectedDays([...tpl.days]);
    setMessage('');
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleDeploy = async () => {
    const tpl = CAMPUS_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!tpl || selectedDays.length === 0) {
      setMessage('Please select at least one day.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const firstRoomId = rooms[0]?.room_id || '';
      const name = `${tpl.name} [${selectedDays.join(',')}]`;
      await createSchedule({
        schedule_name: name,
        start_time: tpl.startTime,
        end_time: tpl.endTime,
        room_id: firstRoomId,
      });
      setMessage(`\u2713 "${tpl.name}" deployed for ${selectedDays.join(', ')}`);
      setSelectedTemplate(null);
      setSelectedDays([]);
      onTemplateDeployed?.();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to deploy template. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeTemplate = CAMPUS_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-secondary uppercase tracking-wider">
          Campus Recommended Templates
        </h2>
        {message && (
          <span className={`text-xs font-bold tracking-wide transition-all ${message.startsWith('\u2713') ? 'text-primary-dark' : 'text-red-600'}`}>
            {message}
          </span>
        )}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-3 gap-3">
        {CAMPUS_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const isSelected = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`text-left rounded-2xl p-4 border-2 transition-all duration-200 hover:scale-[1.01] ${
                isSelected
                  ? 'border-primary-dark bg-primary-dark/5 shadow-md'
                  : 'border-transparent bg-[#F1F5F9] hover:border-neutral-border'
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${tpl.color}18` }}>
                  <Icon size={16} style={{ color: tpl.color }} />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary-dark flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-xs font-bold text-black leading-tight mb-1">{tpl.name}</h3>
              <p className="text-[10px] text-secondary leading-relaxed line-clamp-2">{tpl.description}</p>
              <div className="mt-2.5 flex items-center gap-1">
                <span className="text-[9px] font-black text-secondary-light px-1.5 py-0.5 bg-neutral rounded-md border border-neutral-border/60">
                  {tpl.startTime.slice(0, 5)}
                </span>
                <span className="text-[9px] text-secondary-light">&rarr;</span>
                <span className="text-[9px] font-black text-secondary-light px-1.5 py-0.5 bg-neutral rounded-md border border-neutral-border/60">
                  {tpl.endTime.slice(0, 5)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Day Selector (shown when template is selected) */}
      {activeTemplate && (
        <div className="bg-white border-2 border-primary-dark/20 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${activeTemplate.color}18` }}>
              <activeTemplate.icon size={16} style={{ color: activeTemplate.color }} />
            </div>
            <div>
              <p className="text-xs font-black text-black">{activeTemplate.name}</p>
              <p className="text-[10px] text-secondary">{activeTemplate.startTime.slice(0, 5)} &ndash; {activeTemplate.endTime.slice(0, 5)}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-secondary-light uppercase tracking-widest mb-2">
              Select Active Days
            </p>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map(day => {
                const isActive = selectedDays.includes(day);
                const isWeekend = day === 'SAT' || day === 'SUN';
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-10 rounded-xl text-[11px] font-black border-2 transition-all ${
                      isActive
                        ? 'bg-primary-dark text-white border-primary-dark shadow-sm'
                        : isWeekend
                        ? 'bg-neutral text-tertiary border-neutral-border hover:border-primary-dark/40'
                        : 'bg-neutral text-secondary-dark border-neutral-border hover:border-primary-dark/40'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-secondary">
              {selectedDays.length === 0
                ? 'Select at least 1 day'
                : `Will run ${selectedDays.length} day(s): ${selectedDays.join(', ')}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedTemplate(null); setSelectedDays([]); }}
                className="px-4 py-2 rounded-xl text-[11px] font-bold text-secondary border border-neutral-border hover:bg-neutral transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={loading || selectedDays.length === 0}
                className="px-5 py-2 rounded-xl text-[11px] font-black bg-primary-dark text-white hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? 'Deploying...' : `Deploy to ${selectedDays.length} day(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
