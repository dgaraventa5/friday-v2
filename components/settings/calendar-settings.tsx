'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarSlotCard } from './calendar-slot-card';
import { CalendarSetupModal } from './calendar-setup-modal';
import { ICalUrlModal } from './ical-url-modal';
import { GoogleCalendarSelectModal } from './google-calendar-select-modal';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ConnectedCalendar, CalendarSlot } from '@/lib/types';

interface CalendarSettingsProps {
  initialConnections: ConnectedCalendar[];
}

const SLOTS: { slot: CalendarSlot; label: string; description: string }[] = [
  { slot: 'personal', label: 'Personal', description: 'Your personal events and appointments' },
  { slot: 'work', label: 'Work', description: 'Work meetings and deadlines' },
];

export function CalendarSettings({ initialConnections }: CalendarSettingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<ConnectedCalendar[]>(initialConnections);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [setupModalSlot, setSetupModalSlot] = useState<CalendarSlot | null>(null);
  const [icalModalSlot, setIcalModalSlot] = useState<CalendarSlot | null>(null);
  const [googleSelectData, setGoogleSelectData] = useState<{
    slot: CalendarSlot;
    sessionId: string;
    calendars: Array<{ id: string; summary: string; primary?: boolean }>;
    accountEmail: string;
  } | null>(null);

  // Handle Google OAuth callback - fetch session data from secure server-side storage
  useEffect(() => {
    const isGoogleCallback = searchParams.get('google_callback') === 'true';
    const slot = searchParams.get('slot') as CalendarSlot;
    const oauthSession = searchParams.get('oauth_session');
    const error = searchParams.get('error');

    if (error) {
      setMessage({ type: 'error', text: decodeURIComponent(error) });
      // Clear URL params
      router.replace('/settings', { scroll: false });
      return;
    }

    if (isGoogleCallback && slot && oauthSession) {
      // Fetch session data from secure server-side storage
      fetch(`/api/calendar/google/session?session_id=${oauthSession}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setMessage({ type: 'error', text: data.error });
          } else {
            setGoogleSelectData({
              slot: data.slot,
              sessionId: oauthSession,
              calendars: data.calendars,
              accountEmail: data.googleAccountEmail,
            });
          }
        })
        .catch(() => {
          setMessage({ type: 'error', text: 'Failed to retrieve OAuth session' });
        });
      // Clear URL params
      router.replace('/settings', { scroll: false });
    }
  }, [searchParams, router]);

  const getConnectionForSlot = (slot: CalendarSlot): ConnectedCalendar | undefined => {
    return connections.find(c => c.slot === slot);
  };

  const handleSetup = (slot: CalendarSlot) => {
    setSetupModalSlot(slot);
  };

  const handleConnectionTypeSelect = async (type: 'google' | 'ical_url') => {
    const slot = setupModalSlot;
    setSetupModalSlot(null);

    if (!slot) return;

    if (type === 'google') {
      // Start Google OAuth flow
      try {
        const response = await fetch(`/api/calendar/google/auth?slot=${slot}`);
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          setMessage({ type: 'error', text: 'Failed to start Google OAuth' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to connect to Google' });
      }
    } else {
      // Open iCal URL modal
      setIcalModalSlot(slot);
    }
  };

  const handleICalConnect = async (url: string, name: string, color: string) => {
    const slot = icalModalSlot;
    setIcalModalSlot(null);

    if (!slot) return;

    try {
      const response = await fetch('/api/calendar/ical/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, url, name, color }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to connect calendar' });
        return;
      }

      setMessage({ type: 'success', text: `Calendar connected! ${data.syncResult.eventsUpserted} events synced.` });
      refreshConnections();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect calendar' });
    }
  };

  const handleGoogleCalendarSelect = async (calendarId: string, calendarName: string, color: string) => {
    if (!googleSelectData) return;

    try {
      const response = await fetch('/api/calendar/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: googleSelectData.sessionId,
          calendarId,
          calendarName,
          color,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to connect calendar' });
        return;
      }

      setMessage({ type: 'success', text: `Calendar connected! ${data.syncResult.eventsUpserted} events synced.` });
      setGoogleSelectData(null);
      refreshConnections();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect calendar' });
    }
  };

  const handleDisconnect = async (slot: CalendarSlot) => {
    try {
      const response = await fetch(`/api/calendar/disconnect?slot=${slot}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Failed to disconnect calendar' });
        return;
      }

      setMessage({ type: 'success', text: 'Calendar disconnected' });
      refreshConnections();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disconnect calendar' });
    }
  };

  const handleColorChange = async (connectionId: string, color: string) => {
    // This would need an update endpoint - for now just refresh
    refreshConnections();
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'All calendars synced successfully' });
      } else {
        setMessage({ type: 'error', text: 'Some calendars failed to sync' });
      }

      refreshConnections();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync calendars' });
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshConnections = () => {
    router.refresh();
  };

  // Get last synced time from connections
  const lastSyncedAt = connections.reduce((latest, conn) => {
    if (!conn.last_synced_at) return latest;
    if (!latest) return conn.last_synced_at;
    return conn.last_synced_at > latest ? conn.last_synced_at : latest;
  }, null as string | null);

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-2 rounded-lg border text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Connected Calendars
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Connect calendars to see events on your dashboard
          </p>
        </div>
        {connections.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </Button>
        )}
      </div>

      {lastSyncedAt && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Last synced: {new Date(lastSyncedAt).toLocaleString()}
        </p>
      )}

      <div className="space-y-3">
        {SLOTS.map(({ slot, label, description }) => (
          <CalendarSlotCard
            key={slot}
            slot={slot}
            label={label}
            description={description}
            connection={getConnectionForSlot(slot)}
            onSetup={() => handleSetup(slot)}
            onDisconnect={() => handleDisconnect(slot)}
            onColorChange={handleColorChange}
          />
        ))}
      </div>

      {/* Setup Modal */}
      <CalendarSetupModal
        open={setupModalSlot !== null}
        onOpenChange={(open) => !open && setSetupModalSlot(null)}
        slot={setupModalSlot || 'personal'}
        onSelectType={handleConnectionTypeSelect}
      />

      {/* iCal URL Modal */}
      <ICalUrlModal
        open={icalModalSlot !== null}
        onOpenChange={(open) => !open && setIcalModalSlot(null)}
        slot={icalModalSlot || 'personal'}
        onConnect={handleICalConnect}
      />

      {/* Google Calendar Select Modal */}
      {googleSelectData && (
        <GoogleCalendarSelectModal
          open={true}
          onOpenChange={(open) => !open && setGoogleSelectData(null)}
          slot={googleSelectData.slot}
          calendars={googleSelectData.calendars}
          accountEmail={googleSelectData.accountEmail}
          onSelect={handleGoogleCalendarSelect}
        />
      )}
    </div>
  );
}
