import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy, fadeFast } from '../motion.ts';
import { Clock, Calendar, X, Check } from 'lucide-react';
import { SchedulePresetOption } from '../types.ts';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (timestamp: number) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
}) => {
  const [isCustom, setIsCustom] = useState(false);
  const now = new Date();

  // Custom date/time state
  const defaultDateStr = now.toISOString().split('T')[0];
  const defaultTimeStr = `${String(now.getHours() + 1).padStart(2, '0')}:00`;
  const [customDate, setCustomDate] = useState(defaultDateStr);
  const [customTime, setCustomTime] = useState(defaultTimeStr);


  // Build presets based on current time
  const presets: SchedulePresetOption[] = [];

  // Later today (if before 5:00 PM)
  if (now.getHours() < 17) {
    const laterToday = new Date(now);
    laterToday.setHours(18, 0, 0, 0);
    presets.push({
      id: 'later_today',
      label: 'Later today',
      timeLabel: '6:00 PM',
      timestamp: laterToday.getTime(),
    });
  }

  // Later tonight
  if (now.getHours() < 20) {
    const tonight = new Date(now);
    tonight.setHours(21, 0, 0, 0);
    presets.push({
      id: 'tonight',
      label: 'Later tonight',
      timeLabel: '9:00 PM',
      timestamp: tonight.getTime(),
    });
  }

  // Tomorrow morning (8:00 AM)
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(now.getDate() + 1);
  tomorrowMorning.setHours(8, 0, 0, 0);
  presets.push({
    id: 'tomorrow_morning',
    label: 'Tomorrow morning',
    timeLabel: '8:00 AM',
    timestamp: tomorrowMorning.getTime(),
  });

  // Tomorrow afternoon (1:00 PM)
  const tomorrowAfternoon = new Date(now);
  tomorrowAfternoon.setDate(now.getDate() + 1);
  tomorrowAfternoon.setHours(13, 0, 0, 0);
  presets.push({
    id: 'custom',
    label: 'Tomorrow afternoon',
    timeLabel: '1:00 PM',
    timestamp: tomorrowAfternoon.getTime(),
  });

  const handleCustomConfirm = () => {
    try {
      const combined = new Date(`${customDate}T${customTime}:00`);
      if (isNaN(combined.getTime())) return;
      onSchedule(combined.getTime());
      onClose();
    } catch {
      // invalid date
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      key="overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fadeFast}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <motion.div
        className="relative w-full max-w-sm bg-white dark:bg-m3-d2 border border-m3-line dark:border-m3-d4 rounded-t-3xl sm:rounded-3xl shadow-2xl z-50 overflow-hidden"
        initial={{ opacity: 0, y: 72 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 56 }} transition={spring}
      >
        {/* Grab bar on mobile */}
        <div className="w-10 h-1.5 bg-m3-variant-dk dark:bg-m3-variant rounded-full mx-auto my-3 sm:hidden" />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-m3-primary-container dark:bg-m3-primary-deep flex items-center justify-center text-m3-primary dark:text-m3-primary-light">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-m3-on-surface dark:text-m3-on-surface-dk">
                Schedule send
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-m3-outline hover:text-m3-on-surface dark:hover:text-white rounded-full hover:bg-black/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isCustom ? (
            <div className="space-y-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={`${preset.id}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSchedule(preset.timestamp);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-m3-surface-hi dark:hover:bg-m3-d3 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-m3-outline dark:text-m3-outline-dk group-hover:text-m3-primary" />
                    <span className="text-sm font-medium text-m3-on-surface dark:text-m3-on-surface-dk">
                      {preset.label}
                    </span>
                  </div>
                  <span className="text-xs text-m3-outline dark:text-m3-outline-dk font-mono">
                    {preset.timeLabel}
                  </span>
                </button>
              ))}

              {/* Custom Date & Time button */}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-m3-surface-hi dark:hover:bg-m3-d3 text-left transition-colors text-m3-primary dark:text-m3-primary-light"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold">Pick date & time</span>
              </button>
            </div>
          ) : (
            /* Custom Date & Time Picker */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-m3-variant dark:text-m3-variant-dk mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-m3-variant-dk dark:border-m3-variant bg-transparent text-sm text-m3-on-surface dark:text-m3-on-surface-dk outline-none focus:border-m3-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-m3-variant dark:text-m3-variant-dk mb-1">
                  Select Time
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-m3-variant-dk dark:border-m3-variant bg-transparent text-sm text-m3-on-surface dark:text-m3-on-surface-dk outline-none focus:border-m3-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="px-4 py-2 text-xs font-medium text-m3-variant dark:text-m3-variant-dk hover:bg-black/5 rounded-full"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCustomConfirm}
                  className="px-5 py-2 text-xs font-semibold bg-m3-primary text-white rounded-full hover:bg-m3-primary-hover shadow-sm"
                >
                  Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
