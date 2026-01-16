# Product Requirements Document: Calendar Integration for Friday

**Version:** 1.0  
**Date:** January 14, 2026  
**Status:** Draft  
**Depends On:** Reminders Feature (for Birthday integration)

---

## 1. Overview

### 1.1 Problem Statement

Friday helps users prioritize their daily tasks, but it currently operates in isolation from users' existing schedules. Users have meetings, appointments, and commitments tracked in external calendar applications (Google Calendar, Apple Calendar) that directly impact how much time they have available for tasks. Without visibility into these commitments:

- The task prioritization algorithm may surface more tasks than a user can realistically complete
- Users must mentally reconcile their Friday tasks with their calendar elsewhere
- Important dates like birthdays require manual entry as reminders

### 1.2 Proposed Solution

Introduce Calendar Integration that allows users to connect their external calendars to Friday. This integration will:

1. Display today's calendar events on the Today screen alongside tasks and reminders
2. Calculate "available hours" based on calendar events marked as "busy"
3. Inform the task prioritization algorithm to surface only a realistic number of tasks
4. Automatically surface birthday events as acknowledgeable Reminders

### 1.3 Goals

1. Give users a unified view of their day (tasks + calendar + reminders) in one place
2. Make task recommendations more realistic by accounting for calendar commitments
3. Reduce context-switching between Friday and calendar apps
4. Automatically track important dates (birthdays) without manual reminder creation

### 1.4 Non-Goals (v1)

- Creating or editing calendar events from within Friday
- Push notifications for calendar events
- Two-way sync (Friday → external calendars)
- Calendar event conflict resolution or scheduling suggestions
- Integration with Outlook/Microsoft 365 calendars
- More than 3 calendar connections per user

---

## 2. User Stories

### 2.1 Core User Stories

| ID | User Story |
|----|------------|
| US-1 | As a user, I want to connect my Google Calendar so that I can see my events in Friday. |
| US-2 | As a user, I want to connect my Apple Calendar via subscription URL so that I can see those events too. |
| US-3 | As a user, I want to see today's events on the Today screen so I know what's scheduled. |
| US-4 | As a user, I want Friday to show fewer tasks when I have many meetings so my day feels achievable. |
| US-5 | As a user, I want birthday events to appear as Reminders so I can acknowledge them. |
| US-6 | As a user, I want to click a calendar event to open it in my calendar app. |
| US-7 | As a user, I want to assign a color to each calendar for visual distinction. |
| US-8 | As a user, I want to manually refresh my calendar data when needed. |
| US-9 | As a user, I want to disconnect a calendar if I no longer want it synced. |
| US-10 | As a user, I want to connect different Google accounts to different calendar slots (e.g., personal Gmail for Personal, work email for Work). |

### 2.2 Settings User Stories

| ID | User Story |
|----|------------|
| US-11 | As a user, I want a dedicated Calendar section in Settings to manage my connections. |
| US-12 | As a user, I want to see which calendars are connected and their sync status. |
| US-13 | As a user, I want to configure which calendar slot (Personal/Work/Birthdays) each connection fills. |

---

## 3. Functional Requirements

### 3.1 Calendar Connection Types

Friday supports two methods of calendar connection:

#### 3.1.1 Google Calendar (OAuth)

- Full OAuth 2.0 flow via Google Identity Services
- Read-only access to calendar events (`calendar.readonly` scope)
- User selects which Google Calendar(s) to sync after authentication
- Automatic token refresh handling

**Multi-Account Support:**
Each calendar slot can connect to a **different** Google account. For example:
- Personal slot → OAuth with personal@gmail.com
- Work slot → OAuth with dom@company.com (separate work account)

This is independent of the user's Friday login. The OAuth flow must use `prompt: 'select_account'` to force Google's account picker on each connection, allowing users to choose which Google account to authorize for that specific slot.

#### 3.1.2 iCalendar Subscription URL

- User provides a public/shared iCal subscription URL
- Friday fetches and parses the `.ics` feed
- Supports Apple Calendar, Outlook.com, and any CalDAV-compatible service
- Read-only (subscription URLs are inherently one-way)

**How users get iCal URLs:**
- **Apple Calendar (iCloud):** iCloud.com → Calendar → Share Calendar → Public Calendar → Copy Link
- **Google Calendar:** Can also be accessed via iCal URL (Settings → Integrate calendar → Secret address in iCal format)

### 3.2 Calendar Slots

Users can configure up to 3 calendar "slots":

| Slot | Purpose | Event Display | Default Color |
|------|---------|---------------|---------------|
| Personal | Personal appointments, social events | Calendar Section | `#22C55E` (Green) |
| Work | Work meetings, professional commitments | Calendar Section | `#3B82F6` (Blue) |
| Birthdays | Birthday/anniversary events | Reminders Section (as acknowledgeable items) | `#EC4899` (Pink) |

Each slot can be connected to either:
- A Google Calendar (selected after OAuth)
- An iCal subscription URL

### 3.3 Multi-Account Architecture

**Critical Design Decision:** Each calendar slot maintains its own, independent OAuth credentials. This allows users to connect calendars from multiple Google accounts.

**Example User Setup:**
```
Friday Login: personal@gmail.com
├── Personal Slot
│   └── Google OAuth: personal@gmail.com → "Home" calendar
├── Work Slot  
│   └── Google OAuth: dom@company.com → "Work" calendar (DIFFERENT ACCOUNT)
└── Birthdays Slot
    └── iCal URL: Apple Calendar subscription
```

**Implementation Requirements:**
1. Each `connected_calendars` row stores its own `google_access_token` and `google_refresh_token`
2. The OAuth flow must use `prompt: 'select_account consent'` to force Google's account picker
3. Store `google_account_email` to display which account is connected
4. Token refresh must be handled per-connection, not per-user
5. If one connection's tokens expire/fail, others remain functional

### 3.4 Calendar Data Model

#### 3.3.1 Connected Calendars Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `user_id` | uuid | Reference to auth.users |
| `slot` | enum | 'personal' \| 'work' \| 'birthdays' |
| `connection_type` | enum | 'google' \| 'ical_url' |
| `name` | text | Display name (e.g., "Work Calendar") |
| `color` | text | Hex color code for events |
| `google_account_id` | text (nullable) | Google account identifier (unique ID) |
| `google_account_email` | text (nullable) | Google account email for display (e.g., "dom@company.com") |
| `google_calendar_id` | text (nullable) | Specific Google Calendar ID |
| `google_access_token` | text (nullable) | Encrypted OAuth access token |
| `google_refresh_token` | text (nullable) | Encrypted OAuth refresh token |
| `google_token_expiry` | timestamptz (nullable) | Token expiration time |
| `ical_url` | text (nullable) | iCal subscription URL |
| `last_synced_at` | timestamptz | Last successful sync timestamp |
| `sync_error` | text (nullable) | Last sync error message, if any |
| `is_active` | boolean | Whether this connection is active |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

#### 3.3.2 Calendar Events Cache Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `calendar_id` | uuid | Reference to connected_calendars |
| `external_id` | text | Event ID from external source |
| `title` | text | Event title/summary |
| `description` | text (nullable) | Event description |
| `start_time` | timestamptz | Event start time |
| `end_time` | timestamptz | Event end time |
| `is_all_day` | boolean | Whether this is an all-day event |
| `status` | enum | 'busy' \| 'free' \| 'tentative' |
| `location` | text (nullable) | Event location |
| `event_url` | text (nullable) | Link to open event in source calendar |
| `is_birthday` | boolean | Whether this is a birthday event |
| `birthday_contact_name` | text (nullable) | Name of person for birthday events |
| `created_at` | timestamptz | Cache creation timestamp |
| `updated_at` | timestamptz | Cache update timestamp |

**Unique constraint:** (`calendar_id`, `external_id`)

#### 3.3.3 Birthday Acknowledgments Table

Track when users acknowledge birthday reminders:

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique identifier |
| `user_id` | uuid | Reference to auth.users |
| `event_id` | uuid | Reference to calendar_events |
| `acknowledgment_date` | date | Date the birthday was acknowledged |
| `acknowledged_at` | timestamptz | Timestamp of acknowledgment |

**Unique constraint:** (`event_id`, `acknowledgment_date`)

### 3.5 Sync Behavior

#### 3.4.1 Sync Frequency

- **Automatic sync:** Every 60 minutes via background job
- **Manual sync:** User-triggered via refresh button in Settings or Today screen
- **On-demand sync:** When user opens Today screen and last sync > 15 minutes ago

#### 3.4.2 Sync Window

- Fetch events from **today** through **7 days in the future**
- For Birthdays slot: also include events up to **1 day in the past** (to show today's birthdays that started at midnight)
- Delete cached events outside this window during each sync

#### 3.4.3 Sync Process

1. Check if token refresh needed (Google OAuth)
2. Fetch events from external source
3. Parse and normalize event data
4. Upsert events into `calendar_events` cache
5. Remove events no longer in source (for the synced date range)
6. Update `last_synced_at` timestamp
7. Clear or set `sync_error` as appropriate

### 3.6 Available Hours Calculation

The task prioritization algorithm should consider calendar events when determining how many tasks to surface.

#### 3.5.1 Base Assumptions

- Default productive day: **8 hours** (configurable in future)
- Default task time estimate: **1 hour per task** (unless task has explicit estimate)
- Only events with `status = 'busy'` reduce available hours
- All-day events marked as "busy" reduce available hours to **2 hours** (assumes some flexibility)

#### 3.5.2 Calculation Logic

```
Available Hours = Base Hours - Sum(Busy Event Durations)

If Available Hours < 2:
    Available Hours = 2  // Minimum floor

Max Tasks to Surface = floor(Available Hours / Average Task Duration)
```

#### 3.5.3 Edge Cases

| Scenario | Handling |
|----------|----------|
| Overlapping busy events | Count overlap only once |
| Event spans multiple days | Only count portion falling on today |
| No calendar connected | Use default 8 hours |
| Sync error/stale data | Use cached data; show warning if > 24 hours stale |

### 3.7 Birthday Events as Reminders

When a calendar is assigned to the "Birthdays" slot:

1. Events are parsed for birthday indicators (title contains "Birthday", event type is birthday, etc.)
2. Birthday events appear in the **Reminders section** (not Calendar section)
3. Display format: "Wish Happy Birthday to [Name]" or "🎂 [Name]'s Birthday"
4. Users can "acknowledge" birthdays (similar to completing a reminder)
5. Acknowledged birthdays count toward streaks
6. Birthdays cannot be "skipped" (they simply disappear after the day ends)

---

## 4. UI/UX Requirements

### 4.1 Settings: Calendar Section

#### 4.1.1 Settings Navigation Redesign

Add left-side navigation panel within Settings:

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                              [X]   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  General     │  Calendar Connections                        │
│  Tasks       │  ─────────────────────────────────────────   │
│  > Calendar  │                                              │
│  Account     │  Connect your calendars to see events in     │
│              │  Friday and get smarter task recommendations.│
│              │                                              │
│              │  ┌─────────────────────────────────────────┐ │
│              │  │ Personal Calendar              [Setup]  │ │
│              │  │ Not connected                           │ │
│              │  └─────────────────────────────────────────┘ │
│              │                                              │
│              │  ┌─────────────────────────────────────────┐ │
│              │  │ Work Calendar                  [Setup]  │ │
│              │  │ Not connected                           │ │
│              │  └─────────────────────────────────────────┘ │
│              │                                              │
│              │  ┌─────────────────────────────────────────┐ │
│              │  │ Birthdays                      [Setup]  │ │
│              │  │ Not connected                           │ │
│              │  └─────────────────────────────────────────┘ │
│              │                                              │
│              │  Last synced: 5 minutes ago    [↻ Refresh]  │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

#### 4.1.2 Connected State

When a calendar is connected, clearly show the source account:

**Google Calendar connection:**
```
┌─────────────────────────────────────────────────────────────┐
│ ● Work Calendar                              [Disconnect]   │
│   Google Calendar • dom@company.com                         │
│   Calendar: "Work"                                          │
│   Color: [■ Blue ▼]                                         │
│   Last synced: 5 min ago                                    │
└─────────────────────────────────────────────────────────────┘
```

**iCal URL connection:**
```
┌─────────────────────────────────────────────────────────────┐
│ ● Personal Calendar                          [Disconnect]   │
│   iCal Subscription                                         │
│   Calendar: "Home"                                          │
│   Color: [■ Green ▼]                                        │
│   Last synced: 5 min ago                                    │
└─────────────────────────────────────────────────────────────┘
```

**Key:** The Google account email (e.g., `dom@company.com`) should be prominently displayed so users know which account is connected to each slot.

#### 4.1.3 Calendar Setup Modal

When user clicks [Setup] for a slot:

```
┌─────────────────────────────────────────────────────────────┐
│ Connect Personal Calendar                             [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Choose how to connect:                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [G] Connect Google Calendar                            ││
│  │      Sign in with Google to access your calendars       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  [📅] Add iCal Subscription URL                         ││
│  │      For Apple Calendar, Outlook, or other providers    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  🔒 Privacy: Friday only requests read-only access to   ││
│  │     your calendar. We cannot access your email, files,  ││
│  │     or any other data.                                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.4 iCal URL Input Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Add iCal Subscription                                 [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Calendar Name                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Home Calendar                                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  iCal URL                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ https://caldav.icloud.com/...                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Color                                                      │
│  [■ Green ▼]                                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 💡 How to get your iCal URL                             ││
│  │                                                         ││
│  │ Apple Calendar (iCloud):                                ││
│  │ 1. Go to icloud.com/calendar                            ││
│  │ 2. Click the share icon next to your calendar           ││
│  │ 3. Enable "Public Calendar"                             ││
│  │ 4. Copy the subscription URL                            ││
│  │                                                         ││
│  │ [Show instructions for other providers ▼]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                              [Cancel]  [Connect Calendar]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.5 Google Calendar Selection

After Google OAuth, show calendar selection:

```
┌─────────────────────────────────────────────────────────────┐
│ Select a Calendar                                     [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Signed in as: dom@company.com                              │
│                                                             │
│  Choose which calendar to connect:                          │
│                                                             │
│  ○ Work (Primary)                                           │
│  ○ Team Meetings                                            │
│  ○ Personal                                                 │
│  ○ Holidays                                                 │
│                                                             │
│  Color                                                      │
│  [■ Blue ▼]                                                 │
│                                                             │
│                              [Cancel]  [Connect Calendar]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Today Screen: Calendar Display

#### 4.2.1 Mobile & Tablet (< 1024px)

Single column with sections in this order:

1. **Reminders Section** (includes birthday reminders from Birthdays calendar)
2. **Calendar Section** (events from Personal + Work calendars)
3. **Tasks Section** (Today's Focus)

```
┌─────────────────────────────┐
│ Reminders              [+]  │
├─────────────────────────────┤
│ 🎂 Wish Happy Birthday to   │
│    Sarah M.                 │
│ ○ Take medication   8:00 AM │
│ ● Workout          (done)   │
├─────────────────────────────┤
│ Today's Schedule            │
├─────────────────────────────┤
│ All day · Mom's visit       │
├─────────────────────────────┤
│ ● 10:00 AM  Team Standup    │
│ ● 11:30 AM  1:1 with Sarah  │
│ ● 2:00 PM   Project Review  │
│ ○ 4:00 PM   Dentist         │
├─────────────────────────────┤
│ Today's Focus               │
├─────────────────────────────┤
│ Task Card 1                 │
│ Task Card 2                 │
└─────────────────────────────┘
```

**Legend:**
- ● Blue dot = Work calendar event
- ○ Green dot = Personal calendar event
- Color dot matches user-selected calendar color

#### 4.2.2 Desktop (≥ 1024px)

Three-column layout with visual agenda:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌─────────────────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ Today's Focus               │  │ Schedule        │  │ Reminders  [+] │  │
│  ├─────────────────────────────┤  ├─────────────────┤  ├────────────────┤  │
│  │                             │  │ All day         │  │ 🎂 Sarah M.    │  │
│  │  Task Card 1                │  │ ○ Mom's visit   │  │ ○ Take meds    │  │
│  │                             │  ├─────────────────┤  │ ● Workout ✓    │  │
│  │  Task Card 2                │  │ 10 AM           │  │                │  │
│  │                             │  │ ● Team Standup  │  └────────────────┘  │
│  │  Task Card 3                │  │                 │                      │
│  │                             │  │ 11 AM           │                      │
│  │  Task Card 4                │  │ ● 1:1 w/ Sarah  │                      │
│  │                             │  │                 │                      │
│  │                             │  │ 12 PM           │                      │
│  │                             │  │                 │                      │
│  │                             │  │ 1 PM            │                      │
│  │                             │  │                 │                      │
│  │                             │  │ 2 PM            │                      │
│  │                             │  │ ● Project Review│                      │
│  │                             │  │                 │                      │
│  │                             │  │ 3 PM            │                      │
│  │                             │  │                 │                      │
│  │                             │  │ 4 PM            │                      │
│  │                             │  │ ○ Dentist       │                      │
│  └─────────────────────────────┘  └─────────────────┘                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Desktop Schedule Column Features:**
- Visual timeline from 8 AM to 6 PM (or dynamic based on events)
- Events positioned by time
- All-day events shown at top
- Overlapping events shown side-by-side
- Clicking event opens in source calendar app

### 4.3 Calendar Event Card Component

Each event displays:

- Color dot indicating source calendar
- Start time (or "All day")
- Event title
- Location (if present, truncated)
- Click action → opens event in source calendar

```
┌─────────────────────────────────────────────┐
│ ●  10:00 AM  Team Standup                   │
│    Conference Room A                        │
└─────────────────────────────────────────────┘
```

### 4.4 Birthday Reminder Card

Birthdays from the Birthdays calendar appear in Reminders section:

```
┌─────────────────────────────────────────────┐
│ ○ 🎂 Wish Happy Birthday to Sarah M.        │
└─────────────────────────────────────────────┘
```

After acknowledgment:
```
┌─────────────────────────────────────────────┐
│ ● 🎂 Wish Happy Birthday to Sarah M.  ✓     │
│      (acknowledged)                         │
└─────────────────────────────────────────────┘
```

### 4.5 Sync Status Indicator

Show last sync time and refresh option:

**In Settings:** Full display with manual refresh button

**On Today Screen:** Subtle indicator (e.g., tooltip on calendar section header)

**Error State:** Show warning icon with error message
```
┌─────────────────────────────────────────────┐
│ ⚠️ Calendar sync failed                     │
│    Google Calendar couldn't be reached.     │
│    Using data from 2 hours ago.             │
│                         [Try Again]         │
└─────────────────────────────────────────────┘
```

### 4.6 Empty States

**No calendars connected:**
```
┌─────────────────────────────────────────────┐
│ Today's Schedule                            │
├─────────────────────────────────────────────┤
│                                             │
│  📅 Connect your calendar                   │
│     See your schedule alongside your tasks  │
│                                             │
│              [Connect Calendar]             │
│                                             │
└─────────────────────────────────────────────┘
```

**No events today:**
```
┌─────────────────────────────────────────────┐
│ Today's Schedule                            │
├─────────────────────────────────────────────┤
│                                             │
│  ✨ No events scheduled                     │
│     Your calendar is clear today!           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5. Technical Implementation

### 5.1 Database Schema (Supabase/PostgreSQL)

```sql
-- Create connected_calendars table
CREATE TABLE public.connected_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('personal', 'work', 'birthdays')),
  connection_type TEXT NOT NULL CHECK (connection_type IN ('google', 'ical_url')),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  
  -- Google OAuth fields (encrypted at rest via Supabase Vault in production)
  google_account_id TEXT,
  google_account_email TEXT, -- Display email (e.g., "dom@company.com")
  google_calendar_id TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMPTZ,
  
  -- iCal fields
  ical_url TEXT,
  
  -- Sync metadata
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One connection per slot per user
  UNIQUE(user_id, slot)
);

-- Create calendar_events cache table
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES public.connected_calendars(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'busy' CHECK (status IN ('busy', 'free', 'tentative')),
  location TEXT,
  event_url TEXT,
  is_birthday BOOLEAN DEFAULT false,
  birthday_contact_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(calendar_id, external_id)
);

-- Create birthday_acknowledgments table
CREATE TABLE public.birthday_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  acknowledgment_date DATE NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(event_id, acknowledgment_date)
);

-- Enable RLS
ALTER TABLE public.connected_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthday_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS policies for connected_calendars
CREATE POLICY "calendars_select_own" ON public.connected_calendars
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calendars_insert_own" ON public.connected_calendars
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendars_update_own" ON public.connected_calendars
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "calendars_delete_own" ON public.connected_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for calendar_events (via calendar ownership)
CREATE POLICY "events_select_own" ON public.calendar_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );
CREATE POLICY "events_insert_own" ON public.calendar_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );
CREATE POLICY "events_update_own" ON public.calendar_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );
CREATE POLICY "events_delete_own" ON public.calendar_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.connected_calendars WHERE id = calendar_id AND user_id = auth.uid())
  );

-- RLS policies for birthday_acknowledgments
CREATE POLICY "acknowledgments_select_own" ON public.birthday_acknowledgments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "acknowledgments_insert_own" ON public.birthday_acknowledgments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "acknowledgments_delete_own" ON public.birthday_acknowledgments
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX calendars_user_id_idx ON public.connected_calendars(user_id);
CREATE INDEX calendars_slot_idx ON public.connected_calendars(slot);
CREATE INDEX events_calendar_id_idx ON public.calendar_events(calendar_id);
CREATE INDEX events_start_time_idx ON public.calendar_events(start_time);
CREATE INDEX events_is_birthday_idx ON public.calendar_events(is_birthday);
CREATE INDEX acknowledgments_user_date_idx ON public.birthday_acknowledgments(user_id, acknowledgment_date);
```

### 5.2 TypeScript Interfaces

Add to `lib/types.ts`:

```typescript
// Calendar connection types
export type CalendarSlot = 'personal' | 'work' | 'birthdays';
export type CalendarConnectionType = 'google' | 'ical_url';
export type EventStatus = 'busy' | 'free' | 'tentative';

export interface ConnectedCalendar {
  id: string;
  user_id: string;
  slot: CalendarSlot;
  connection_type: CalendarConnectionType;
  name: string;
  color: string;
  google_account_id: string | null;
  google_account_email: string | null;
  google_calendar_id: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  ical_url: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  external_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  status: EventStatus;
  location: string | null;
  event_url: string | null;
  is_birthday: boolean;
  birthday_contact_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface BirthdayAcknowledgment {
  id: string;
  user_id: string;
  event_id: string;
  acknowledgment_date: string;
  acknowledged_at: string;
}

// Extended types for UI
export interface CalendarEventWithCalendar extends CalendarEvent {
  calendar: Pick<ConnectedCalendar, 'name' | 'color' | 'slot'>;
}

export interface BirthdayReminderEvent extends CalendarEvent {
  isAcknowledged: boolean;
  displayTitle: string; // "Wish Happy Birthday to [Name]"
}

export interface TodayCalendarData {
  events: CalendarEventWithCalendar[];
  birthdayReminders: BirthdayReminderEvent[];
  availableHours: number;
  lastSyncedAt: string | null;
  syncError: string | null;
}

// Settings types
export interface CalendarSlotConfig {
  slot: CalendarSlot;
  displayName: string;
  description: string;
  defaultColor: string;
  connection: ConnectedCalendar | null;
}
```

### 5.3 New Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/types.ts` | Add calendar-related interfaces |
| `lib/utils/calendar-utils.ts` | Event parsing, available hours calculation |
| `lib/utils/ical-parser.ts` | Parse iCal .ics feeds |
| `lib/google/calendar-client.ts` | Google Calendar API client wrapper |
| `lib/google/oauth.ts` | Google OAuth flow handling |
| `components/calendar/calendar-event-card.tsx` | Individual event display |
| `components/calendar/calendar-section.tsx` | Today screen calendar section |
| `components/calendar/calendar-timeline.tsx` | Desktop visual timeline |
| `components/calendar/birthday-reminder-card.tsx` | Birthday as reminder display |
| `components/settings/settings-layout.tsx` | New settings layout with side nav |
| `components/settings/calendar-settings.tsx` | Calendar connections management |
| `components/settings/calendar-setup-modal.tsx` | Connection setup flow |
| `components/settings/ical-url-modal.tsx` | iCal URL input form |
| `components/settings/google-calendar-select.tsx` | Google Calendar selection after OAuth |
| `app/api/calendar/sync/route.ts` | Manual sync endpoint |
| `app/api/calendar/connect/google/route.ts` | Google OAuth callback handler |
| `app/api/calendar/connect/ical/route.ts` | iCal URL validation and save |
| `app/api/calendar/disconnect/route.ts` | Remove calendar connection |
| `app/api/calendar/events/route.ts` | Fetch today's events |
| `app/api/birthday/acknowledge/route.ts` | Acknowledge birthday reminder |
| `app/api/cron/sync-calendars/route.ts` | Background sync job (Vercel Cron) |
| `scripts/00X_create_calendar_tables.sql` | Database migration script |

### 5.4 Files to Modify

| File Path | Changes Required |
|-----------|------------------|
| `app/dashboard/page.tsx` | Fetch calendar events alongside tasks/reminders |
| `components/dashboard/dashboard-client.tsx` | Add calendar state, pass to TodayView |
| `components/today/today-view.tsx` | Add CalendarSection, update responsive layout |
| `components/reminders/reminders-section.tsx` | Include birthday reminders |
| `lib/utils/task-prioritization.ts` | Factor in available hours |
| `lib/utils/streak-tracking.ts` | Include birthday acknowledgments |
| `app/settings/page.tsx` | Implement new settings layout |
| `package.json` | Add dependencies: `googleapis`, `ical.js`, `node-ical` |

### 5.5 Key Utility Functions

Create in `lib/utils/calendar-utils.ts`:

```typescript
import { CalendarEvent, CalendarEventWithCalendar, BirthdayReminderEvent, TodayCalendarData, ConnectedCalendar, BirthdayAcknowledgment } from '@/lib/types';
import { getTodayLocal, parseDateLocal } from './date-utils';

const DEFAULT_PRODUCTIVE_HOURS = 8;
const MINIMUM_AVAILABLE_HOURS = 2;
const ALL_DAY_BUSY_HOURS = 6; // Assume 6 hours blocked for all-day busy events

/**
 * Calculate available hours for today based on calendar events
 */
export function calculateAvailableHours(events: CalendarEvent[]): number {
  const today = getTodayLocal();
  const todayStart = parseDateLocal(today);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Filter to busy events only
  const busyEvents = events.filter(e => e.status === 'busy');
  
  if (busyEvents.length === 0) {
    return DEFAULT_PRODUCTIVE_HOURS;
  }

  // Handle all-day busy events
  const hasAllDayBusy = busyEvents.some(e => e.is_all_day);
  if (hasAllDayBusy) {
    return MINIMUM_AVAILABLE_HOURS;
  }

  // Calculate total busy minutes, handling overlaps
  const busyMinutes = calculateBusyMinutes(busyEvents, todayStart, todayEnd);
  const busyHours = busyMinutes / 60;
  
  const availableHours = DEFAULT_PRODUCTIVE_HOURS - busyHours;
  return Math.max(availableHours, MINIMUM_AVAILABLE_HOURS);
}

/**
 * Calculate total busy minutes, accounting for overlapping events
 */
function calculateBusyMinutes(
  events: CalendarEvent[],
  dayStart: Date,
  dayEnd: Date
): number {
  // Convert events to time intervals
  const intervals = events.map(event => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    
    // Clamp to today's boundaries
    const clampedStart = start < dayStart ? dayStart : start;
    const clampedEnd = end > dayEnd ? dayEnd : end;
    
    return {
      start: clampedStart.getTime(),
      end: clampedEnd.getTime()
    };
  }).filter(i => i.end > i.start); // Remove invalid intervals

  if (intervals.length === 0) return 0;

  // Sort by start time
  intervals.sort((a, b) => a.start - b.start);

  // Merge overlapping intervals
  const merged: { start: number; end: number }[] = [];
  let current = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i].start <= current.end) {
      // Overlapping, extend current interval
      current.end = Math.max(current.end, intervals[i].end);
    } else {
      // Not overlapping, save current and start new
      merged.push(current);
      current = intervals[i];
    }
  }
  merged.push(current);

  // Sum up total minutes
  return merged.reduce((total, interval) => {
    return total + (interval.end - interval.start) / (1000 * 60);
  }, 0);
}

/**
 * Filter events to today only
 */
export function getTodaysEvents(
  events: CalendarEventWithCalendar[]
): CalendarEventWithCalendar[] {
  const today = getTodayLocal();
  const todayStart = parseDateLocal(today);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return events.filter(event => {
    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    
    // Event overlaps with today
    return eventStart < todayEnd && eventEnd > todayStart;
  });
}

/**
 * Get non-birthday events for calendar display
 */
export function getCalendarDisplayEvents(
  events: CalendarEventWithCalendar[]
): CalendarEventWithCalendar[] {
  return getTodaysEvents(events)
    .filter(e => !e.is_birthday && e.calendar.slot !== 'birthdays')
    .sort((a, b) => {
      // All-day events first
      if (a.is_all_day && !b.is_all_day) return -1;
      if (!a.is_all_day && b.is_all_day) return 1;
      // Then by start time
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
}

/**
 * Get birthday events as reminder format
 */
export function getBirthdayReminders(
  events: CalendarEventWithCalendar[],
  acknowledgments: BirthdayAcknowledgment[]
): BirthdayReminderEvent[] {
  const today = getTodayLocal();
  const todayAcks = acknowledgments.filter(a => a.acknowledgment_date === today);

  return getTodaysEvents(events)
    .filter(e => e.is_birthday || e.calendar.slot === 'birthdays')
    .map(event => {
      const contactName = event.birthday_contact_name || 
        extractNameFromBirthdayTitle(event.title);
      
      return {
        ...event,
        isAcknowledged: todayAcks.some(a => a.event_id === event.id),
        displayTitle: `Wish Happy Birthday to ${contactName}`
      };
    });
}

/**
 * Extract person's name from birthday event title
 */
function extractNameFromBirthdayTitle(title: string): string {
  // Common patterns: "John's Birthday", "Birthday - John Smith", "John Smith's Birthday"
  const patterns = [
    /^(.+?)'s Birthday$/i,
    /^Birthday\s*[-:]\s*(.+)$/i,
    /^(.+?)\s+Birthday$/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1].trim();
  }
  
  // Fallback: return the title as-is
  return title;
}

/**
 * Format event time for display
 */
export function formatEventTime(event: CalendarEvent): string {
  if (event.is_all_day) return 'All day';
  
  const start = new Date(event.start_time);
  const hours = start.getHours();
  const minutes = start.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  if (minutes === 0) {
    return `${displayHours} ${period}`;
  }
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Build calendar deep link to open event in source app
 */
export function buildEventDeepLink(event: CalendarEvent, calendar: ConnectedCalendar): string {
  if (event.event_url) {
    return event.event_url;
  }
  
  if (calendar.connection_type === 'google' && calendar.google_calendar_id) {
    return `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(event.external_id)}`;
  }
  
  // Fallback: try to open system calendar
  return `webcal://`;
}

/**
 * Get suggested max tasks based on available hours
 */
export function getMaxTasksForAvailableHours(
  availableHours: number,
  avgTaskDuration: number = 1
): number {
  return Math.max(1, Math.floor(availableHours / avgTaskDuration));
}
```

### 5.6 iCal Parser Utility

Create in `lib/utils/ical-parser.ts`:

```typescript
import ICAL from 'ical.js';
import { CalendarEvent } from '@/lib/types';

export interface ParsedICalEvent {
  uid: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  status: 'busy' | 'free' | 'tentative';
  location: string | null;
  isBirthday: boolean;
  birthdayContactName: string | null;
}

/**
 * Parse iCal feed and extract events within date range
 */
export function parseICalFeed(
  icalData: string,
  startDate: Date,
  endDate: Date
): ParsedICalEvent[] {
  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const events: ParsedICalEvent[] = [];

  const vevents = comp.getAllSubcomponents('vevent');

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    
    // Handle recurring events
    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next;
      let count = 0;
      const maxOccurrences = 100; // Safety limit

      while ((next = iterator.next()) && count < maxOccurrences) {
        count++;
        const occurrence = event.getOccurrenceDetails(next);
        const start = occurrence.startDate.toJSDate();
        const end = occurrence.endDate.toJSDate();

        if (start > endDate) break;
        if (end < startDate) continue;

        events.push(parseEventDetails(event, start, end));
      }
    } else {
      const start = event.startDate.toJSDate();
      const end = event.endDate.toJSDate();

      if (start <= endDate && end >= startDate) {
        events.push(parseEventDetails(event, start, end));
      }
    }
  }

  return events;
}

function parseEventDetails(
  event: ICAL.Event,
  start: Date,
  end: Date
): ParsedICalEvent {
  const title = event.summary || 'Untitled Event';
  const isAllDay = event.startDate.isDate;
  const isBirthday = detectBirthdayEvent(event, title);
  
  // Parse status (TRANSP property or default to busy)
  let status: 'busy' | 'free' | 'tentative' = 'busy';
  const transp = event.component.getFirstPropertyValue('transp');
  if (transp === 'TRANSPARENT') {
    status = 'free';
  }
  const icalStatus = event.component.getFirstPropertyValue('status');
  if (icalStatus === 'TENTATIVE') {
    status = 'tentative';
  }

  return {
    uid: event.uid,
    title,
    description: event.description || null,
    startTime: start,
    endTime: end,
    isAllDay,
    status,
    location: event.location || null,
    isBirthday,
    birthdayContactName: isBirthday ? extractBirthdayName(title) : null,
  };
}

function detectBirthdayEvent(event: ICAL.Event, title: string): boolean {
  // Check for birthday-related keywords
  const titleLower = title.toLowerCase();
  if (titleLower.includes('birthday') || titleLower.includes('bday')) {
    return true;
  }
  
  // Check for Apple's birthday calendar category
  const categories = event.component.getFirstPropertyValue('categories');
  if (categories && categories.toLowerCase().includes('birthday')) {
    return true;
  }
  
  return false;
}

function extractBirthdayName(title: string): string | null {
  const patterns = [
    /^(.+?)'s Birthday$/i,
    /^Birthday\s*[-:]\s*(.+)$/i,
    /^(.+?)\s+Birthday$/i,
    /^(.+?)'s Bday$/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1].trim();
  }
  
  return null;
}

/**
 * Validate iCal URL by fetching and attempting to parse
 */
export async function validateICalUrl(url: string): Promise<{
  valid: boolean;
  error?: string;
  calendarName?: string;
}> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { valid: false, error: `Failed to fetch: ${response.status}` };
    }
    
    const data = await response.text();
    const jcalData = ICAL.parse(data);
    const comp = new ICAL.Component(jcalData);
    
    const calendarName = comp.getFirstPropertyValue('x-wr-calname') || 'Calendar';
    
    return { valid: true, calendarName };
  } catch (error) {
    return { valid: false, error: 'Invalid iCal format' };
  }
}
```

### 5.7 Google Calendar Client

Create in `lib/google/calendar-client.ts`:

```typescript
import { google } from 'googleapis';
import { ConnectedCalendar, CalendarEvent } from '@/lib/types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI!;

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email', // Required to get account email
    ],
    state,
    prompt: 'select_account consent', // CRITICAL: Force account picker for multi-account support
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  
  return {
    id: data.id!,
    email: data.email!,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function listUserCalendars(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const response = await calendar.calendarList.list();
  
  return response.data.items?.map(cal => ({
    id: cal.id!,
    name: cal.summary || 'Untitled',
    primary: cal.primary || false,
    backgroundColor: cal.backgroundColor,
  })) || [];
}

export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  startDate: Date,
  endDate: Date
) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true, // Expand recurring events
    orderBy: 'startTime',
    maxResults: 250,
  });

  return response.data.items?.map(event => ({
    externalId: event.id!,
    title: event.summary || 'Untitled Event',
    description: event.description || null,
    startTime: event.start?.dateTime || event.start?.date!,
    endTime: event.end?.dateTime || event.end?.date!,
    isAllDay: !event.start?.dateTime,
    status: mapGoogleStatus(event.transparency, event.status),
    location: event.location || null,
    eventUrl: event.htmlLink || null,
    isBirthday: detectGoogleBirthday(event),
    birthdayContactName: detectGoogleBirthday(event) 
      ? extractNameFromTitle(event.summary || '') 
      : null,
  })) || [];
}

function mapGoogleStatus(
  transparency?: string | null, 
  status?: string | null
): 'busy' | 'free' | 'tentative' {
  if (transparency === 'transparent') return 'free';
  if (status === 'tentative') return 'tentative';
  return 'busy';
}

function detectGoogleBirthday(event: any): boolean {
  const title = (event.summary || '').toLowerCase();
  if (title.includes('birthday') || title.includes('bday')) return true;
  
  // Check for Google's birthday calendar type
  if (event.birthdayProperties) return true;
  
  return false;
}

function extractNameFromTitle(title: string): string | null {
  const patterns = [
    /^(.+?)'s Birthday$/i,
    /^Birthday\s*[-:]\s*(.+)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}
```

### 5.8 Updated Task Prioritization

Modify `lib/utils/task-prioritization.ts`:

```typescript
// Add to existing getTodaysFocusTasks function or create wrapper

import { calculateAvailableHours, getMaxTasksForAvailableHours } from './calendar-utils';
import { CalendarEvent } from '@/lib/types';

/**
 * Get today's focus tasks, optionally limited by calendar availability
 */
export function getTodaysFocusTasksWithCalendar(
  tasks: Task[],
  calendarEvents: CalendarEvent[] = [],
  options: {
    respectCalendar?: boolean;
    avgTaskDuration?: number;
  } = {}
): Task[] {
  const { respectCalendar = true, avgTaskDuration = 1 } = options;
  
  // Get base prioritized tasks
  let focusTasks = getTodaysFocusTasks(tasks);
  
  if (respectCalendar && calendarEvents.length > 0) {
    const availableHours = calculateAvailableHours(calendarEvents);
    const maxTasks = getMaxTasksForAvailableHours(availableHours, avgTaskDuration);
    
    // Limit to max tasks, but always show at least 1
    focusTasks = focusTasks.slice(0, Math.max(1, maxTasks));
  }
  
  return focusTasks;
}
```

### 5.9 Streak Integration

Modify `lib/utils/streak-tracking.ts`:

```typescript
// Add birthday acknowledgment check to existing streak logic

export async function hasCompletedAnythingToday(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const today = getTodayLocal();
  
  // Check for completed tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('completed', true)
    .eq('start_date', today)
    .limit(1);
  
  if (tasks && tasks.length > 0) return true;
  
  // Check for completed reminders (not skipped)
  const { data: reminderCompletions } = await supabase
    .from('reminder_completions')
    .select('id, reminders!inner(user_id)')
    .eq('reminders.user_id', userId)
    .eq('completion_date', today)
    .eq('status', 'completed')
    .limit(1);
  
  if (reminderCompletions && reminderCompletions.length > 0) return true;
  
  // Check for acknowledged birthdays
  const { data: birthdayAcks } = await supabase
    .from('birthday_acknowledgments')
    .select('id')
    .eq('user_id', userId)
    .eq('acknowledgment_date', today)
    .limit(1);
  
  return birthdayAcks && birthdayAcks.length > 0;
}
```

### 5.10 Background Sync Job

Create in `app/api/cron/sync-calendars/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncCalendar } from '@/lib/utils/calendar-sync';

// Vercel Cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  
  // Fetch all active calendar connections
  const { data: calendars, error } = await supabase
    .from('connected_calendars')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch calendars:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const results = [];

  for (const calendar of calendars || []) {
    try {
      await syncCalendar(calendar);
      results.push({ id: calendar.id, status: 'success' });
    } catch (error) {
      console.error(`Sync failed for calendar ${calendar.id}:`, error);
      results.push({ id: calendar.id, status: 'error', error: String(error) });
    }
  }

  return NextResponse.json({ 
    synced: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results 
  });
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-calendars",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 6. Security Considerations

### 6.1 OAuth Scope Minimization

**Critical:** Friday requests the absolute minimum permissions necessary.

| Scope | Purpose | What It CANNOT Do |
|-------|---------|-------------------|
| `calendar.readonly` | View calendar events | Cannot create, edit, or delete events |
| `userinfo.email` | Display connected account email | Cannot access email content |

**Explicitly NOT Requested (No Access To):**
- ❌ Gmail / Email content (`gmail.readonly`)
- ❌ Google Drive files (`drive.readonly`)
- ❌ Contacts (`contacts.readonly`)
- ❌ Google Docs, Sheets, Slides
- ❌ Google Chat, Meet, or any other Workspace data
- ❌ Write access to calendars (`calendar` scope)

This must be clearly communicated to users, especially those connecting work accounts.

### 6.2 Token Storage

- Google OAuth tokens contain sensitive data
- Store encrypted at rest (Supabase Vault for production)
- Never expose tokens to client-side code
- Implement token rotation on refresh

### 6.3 iCal URL Security

- iCal URLs may contain private calendar data
- Store URLs encrypted
- Validate URL format before storing
- Rate limit iCal fetches to prevent abuse

### 6.4 RLS Policies

- All calendar data protected by Row Level Security
- Users can only access their own connections and events
- API routes validate user authentication

### 6.5 Enterprise/Workspace Considerations

When users connect work Google accounts (Google Workspace):

1. **Admin Controls:** Organization admins may restrict third-party app access
2. **Blocked Apps:** Users may see "This app is blocked by your admin" — this is expected behavior
3. **Audit Visibility:** Admins can see which apps employees have authorized
4. **App Whitelisting:** Some orgs require pre-approval; Friday may need to be whitelisted

**User-Facing Messaging:** If a work account connection fails due to admin restrictions, show a helpful error:
```
"Your organization may restrict third-party app access. 
Please contact your IT admin to allow Friday, or try 
connecting using an iCal subscription URL instead."
```

### 6.6 Environment Variables

Required environment variables:
```
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=
CRON_SECRET=
```

---

## 7. Testing Requirements

### 7.1 Unit Tests

1. `calculateAvailableHours` with various event configurations
2. `calculateBusyMinutes` with overlapping events
3. iCal parser with various .ics formats
4. Birthday detection from event titles
5. Event filtering for today's date
6. Timezone handling for events

### 7.2 Integration Tests

1. Google OAuth flow (mock)
2. iCal URL validation and parsing
3. Calendar event caching (CRUD)
4. Birthday acknowledgment persistence
5. RLS policy enforcement
6. Background sync job execution

### 7.3 E2E Tests

1. Connect Google Calendar → select calendar → see events on Today
2. Add iCal URL → validate → see events on Today
3. Click event → opens in external calendar
4. Birthday appears as reminder → acknowledge → streak updated
5. Disconnect calendar → events removed from Today
6. Manual refresh updates events
7. Change calendar color → UI updates
8. Settings navigation between sections
9. **Multi-account:** Connect Personal slot with account A → Connect Work slot with account B → both show correct events

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Calendar Adoption | 40% of active users connect at least 1 calendar within 30 days |
| Engagement | Users with calendars connected have 25% higher daily retention |
| Task Completion | Task completion rate improves by 15% for users with calendar |
| Sync Reliability | 99% sync success rate |
| Birthday Acknowledgment | 60% of birthday reminders are acknowledged |

---

## 9. Rollout Plan

### Phase 1: Foundation (Week 1-2)
- Database schema and migrations
- Type definitions
- Settings UI with navigation
- Empty states

### Phase 2: iCal Integration (Week 2-3)
- iCal URL input and validation
- iCal parser implementation
- Event caching
- Today screen display (list view)

### Phase 3: Google Calendar (Week 3-4)
- OAuth flow implementation
- Calendar selection UI
- Google Calendar API client
- Token refresh handling

### Phase 4: Birthday Integration (Week 4-5)
- Birthday detection logic
- Birthday reminder cards
- Acknowledgment flow
- Streak integration

### Phase 5: Polish & Launch (Week 5-6)
- Desktop timeline view
- Available hours algorithm
- Task prioritization integration
- Background sync job
- Testing and bug fixes

---

## 10. Open Questions

1. Should we show a "daily summary" of available hours to the user?
2. Should users be able to customize their "productive hours" (default: 8)?
3. Should we support CalDAV for enterprise/self-hosted calendars in v2?
4. How should we handle users in multiple timezones (traveling)?

---

## 11. Future Considerations (Post-v1)

- Outlook/Microsoft 365 calendar integration
- CalDAV support for enterprise users
- Time blocking suggestions based on tasks
- Calendar event creation from Friday
- "Focus time" blocking in external calendars
- Multi-day event display
- Week view in addition to day view
- Calendar sharing between Friday users

---

## Appendix A: Component Hierarchy

```
app/dashboard/page.tsx
└── DashboardClient
    └── TodayView
        ├── RemindersSection
        │   ├── ReminderCard × N
        │   ├── BirthdayReminderCard × N (new)
        │   └── AddReminderModal
        ├── CalendarSection (new)
        │   ├── CalendarEventCard × N (new)
        │   └── CalendarTimeline (desktop only, new)
        └── TasksSection
            └── TaskCard × N

app/settings/page.tsx
└── SettingsLayout (new)
    ├── SettingsNav (new)
    │   ├── General
    │   ├── Tasks
    │   ├── Calendar (new)
    │   └── Account
    └── SettingsContent
        └── CalendarSettings (new)
            ├── CalendarSlotCard × 3 (new)
            ├── CalendarSetupModal (new)
            ├── ICalUrlModal (new)
            └── GoogleCalendarSelectModal (new)
```

## Appendix B: State Flow

```
User clicks "Setup" on Personal calendar slot
    → CalendarSetupModal opens
    → User selects "Add iCal URL"
    → ICalUrlModal opens
    → User enters name, URL, color
    → Client validates URL format
    → POST /api/calendar/connect/ical
    → Server validates URL, parses calendar
    → INSERT into connected_calendars
    → Trigger initial sync
    → INSERT events into calendar_events
    → Modal closes
    → Settings shows connected state

User clicks "Connect Google Calendar"
    → Redirect to Google OAuth
    → User grants permission
    → Redirect to /api/calendar/connect/google
    → Exchange code for tokens
    → Fetch user's calendar list
    → GoogleCalendarSelectModal opens
    → User selects calendar and color
    → INSERT into connected_calendars
    → Trigger initial sync
    → INSERT events into calendar_events
    → Redirect to Settings
    → Settings shows connected state

User opens Today screen
    → Fetch tasks, reminders, calendar events
    → Calculate available hours
    → Filter tasks based on available hours
    → Render RemindersSection (including birthdays)
    → Render CalendarSection
    → Render TasksSection

User clicks birthday reminder checkbox
    → POST /api/birthday/acknowledge
    → INSERT into birthday_acknowledgments
    → Call /api/streak to update streak
    → Update local state to show acknowledged

Background cron runs hourly
    → Fetch all active connected_calendars
    → For each calendar:
        → Refresh token if needed (Google)
        → Fetch events from source
        → Upsert into calendar_events
        → Update last_synced_at
```

## Appendix C: API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/calendar/connect/google` | GET | Initiate Google OAuth |
| `/api/calendar/connect/google/callback` | GET | Handle OAuth callback |
| `/api/calendar/connect/ical` | POST | Save iCal URL connection |
| `/api/calendar/disconnect` | DELETE | Remove calendar connection |
| `/api/calendar/sync` | POST | Trigger manual sync |
| `/api/calendar/events` | GET | Fetch cached events for today |
| `/api/calendar/settings` | GET | Fetch user's calendar configs |
| `/api/birthday/acknowledge` | POST | Mark birthday as acknowledged |
| `/api/cron/sync-calendars` | GET | Background sync job |

## Appendix D: Color Palette (Defaults)

| Slot | Default Color | Hex |
|------|---------------|-----|
| Personal | Green | `#22C55E` |
| Work | Blue | `#3B82F6` |
| Birthdays | Pink | `#EC4899` |

Additional suggested colors for user selection:
- Purple: `#8B5CF6`
- Orange: `#F97316`
- Teal: `#14B8A6`
- Red: `#EF4444`
- Yellow: `#EAB308`
- Indigo: `#6366F1`
- Gray: `#6B7280`
