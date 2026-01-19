'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Link2, AlertCircle, Check } from 'lucide-react';
import { ConnectedCalendar, CalendarSlot } from '@/lib/types';

interface CalendarSlotCardProps {
  slot: CalendarSlot;
  label: string;
  description: string;
  connection?: ConnectedCalendar;
  onSetup: () => void;
  onDisconnect: () => void;
  onColorChange: (connectionId: string, color: string) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export function CalendarSlotCard({
  slot,
  label,
  description,
  connection,
  onSetup,
  onDisconnect,
  onColorChange,
}: CalendarSlotCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(connection?.color || '#3B82F6');

  const isConnected = !!connection;
  const hasError = connection?.sync_error;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (connection) {
      onColorChange(connection.id, color);
    }
    setShowColorPicker(false);
  };

  return (
    <div className="p-3 border border-border rounded-lg bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Color dot or icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isConnected ? connection.color : '#E2E8F0' }}
          >
            {isConnected ? (
              <Calendar className="w-4 h-4 text-white" />
            ) : (
              <Calendar className="w-4 h-4 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {label}
              </h3>
              {hasError && (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>

            {isConnected ? (
              <div className="mt-0.5">
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {connection.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {connection.connection_type === 'google' ? (
                    <>
                      <span>Google</span>
                      {connection.google_account_email && (
                        <span className="truncate">({connection.google_account_email})</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" />
                      <span>iCal URL</span>
                    </>
                  )}
                </p>
                {hasError && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Sync error: {connection.sync_error}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isConnected && (
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: selectedColor }}
                title="Change color"
              />
              {showColorPicker && (
                <div className="absolute right-0 top-8 z-10 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border">
                  <div className="grid grid-cols-4 gap-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        {color === selectedColor && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Disconnect
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onSetup}>
              Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
