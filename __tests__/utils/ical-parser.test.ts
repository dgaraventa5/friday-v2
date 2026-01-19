import { parseICalFeed, normalizeCalendarUrl } from '@/lib/utils/ical-parser';

describe('iCal Parser', () => {
  const createICalEvent = (options: {
    uid?: string;
    summary?: string;
    description?: string;
    dtstart?: string;
    dtend?: string;
    location?: string;
    transp?: string;
    status?: string;
    allDay?: boolean;
    rrule?: string;
  }) => {
    const {
      uid = 'test-uid-123',
      summary = 'Test Event',
      description,
      dtstart = '20251215T100000Z',
      dtend = '20251215T110000Z',
      location,
      transp,
      status,
      allDay = false,
      rrule,
    } = options;

    let event = `BEGIN:VEVENT
UID:${uid}
SUMMARY:${summary}`;

    if (description) {
      event += `\nDESCRIPTION:${description}`;
    }

    if (allDay) {
      // All-day events use DATE format without time
      event += `\nDTSTART;VALUE=DATE:${dtstart.substring(0, 8)}`;
      event += `\nDTEND;VALUE=DATE:${dtend.substring(0, 8)}`;
    } else {
      event += `\nDTSTART:${dtstart}`;
      event += `\nDTEND:${dtend}`;
    }

    if (location) {
      event += `\nLOCATION:${location}`;
    }

    if (transp) {
      event += `\nTRANSP:${transp}`;
    }

    if (status) {
      event += `\nSTATUS:${status}`;
    }

    if (rrule) {
      event += `\nRRULE:${rrule}`;
    }

    event += `\nEND:VEVENT`;

    return event;
  };

  const wrapInCalendar = (events: string) => {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
${events}
END:VCALENDAR`;
  };

  describe('parseICalFeed', () => {
    describe('Standard Events', () => {
      test('should parse a simple event', () => {
        const ical = wrapInCalendar(createICalEvent({
          uid: 'event-1',
          summary: 'Team Meeting',
          dtstart: '20251215T100000Z',
          dtend: '20251215T110000Z',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(events).toHaveLength(1);
        expect(events[0].title).toBe('Team Meeting');
        expect(events[0].external_id).toBe('event-1');
        expect(events[0].is_all_day).toBe(false);
      });

      test('should parse event with description and location', () => {
        const ical = wrapInCalendar(createICalEvent({
          summary: 'Project Review',
          description: 'Quarterly review meeting',
          location: 'Conference Room A',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(events).toHaveLength(1);
        expect(events[0].description).toBe('Quarterly review meeting');
        expect(events[0].location).toBe('Conference Room A');
      });

      test('should parse multiple events', () => {
        const events = [
          createICalEvent({ uid: 'event-1', summary: 'Event 1', dtstart: '20251215T100000Z' }),
          createICalEvent({ uid: 'event-2', summary: 'Event 2', dtstart: '20251216T100000Z' }),
          createICalEvent({ uid: 'event-3', summary: 'Event 3', dtstart: '20251217T100000Z' }),
        ].join('\n');

        const ical = wrapInCalendar(events);

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const result = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(result).toHaveLength(3);
      });

      test('should filter events outside date range', () => {
        const events = [
          createICalEvent({ uid: 'event-1', summary: 'In Range', dtstart: '20251215T100000Z', dtend: '20251215T110000Z' }),
          createICalEvent({ uid: 'event-2', summary: 'Out of Range', dtstart: '20260115T100000Z', dtend: '20260115T110000Z' }),
        ].join('\n');

        const ical = wrapInCalendar(events);

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const result = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('In Range');
      });
    });

    describe('All-Day Events', () => {
      test('should parse all-day events', () => {
        const ical = wrapInCalendar(createICalEvent({
          summary: 'Company Holiday',
          dtstart: '20251225',
          dtend: '20251226',
          allDay: true,
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(events).toHaveLength(1);
        expect(events[0].is_all_day).toBe(true);
      });
    });

    describe('Event Status', () => {
      test('should detect free/transparent events', () => {
        const ical = wrapInCalendar(createICalEvent({
          summary: 'Available Time',
          transp: 'TRANSPARENT',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(events).toHaveLength(1);
        expect(events[0].status).toBe('free');
      });

      test('should detect tentative events', () => {
        const ical = wrapInCalendar(createICalEvent({
          summary: 'Maybe Meeting',
          status: 'TENTATIVE',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(events).toHaveLength(1);
        expect(events[0].status).toBe('tentative');
      });

      test('should default to busy status', () => {
        const ical = wrapInCalendar(createICalEvent({
          summary: 'Regular Meeting',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(events).toHaveLength(1);
        expect(events[0].status).toBe('busy');
      });
    });

    describe('Recurring Events', () => {
      test('should expand daily recurring events', () => {
        const ical = wrapInCalendar(createICalEvent({
          uid: 'daily-standup',
          summary: 'Daily Standup',
          dtstart: '20251201T090000Z',
          dtend: '20251201T091500Z',
          rrule: 'FREQ=DAILY;COUNT=5',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        // Should have 5 occurrences
        expect(events).toHaveLength(5);
        expect(events.every(e => e.title === 'Daily Standup')).toBe(true);
      });

      test('should expand weekly recurring events', () => {
        const ical = wrapInCalendar(createICalEvent({
          uid: 'weekly-meeting',
          summary: 'Weekly Meeting',
          dtstart: '20251201T100000Z',
          dtend: '20251201T110000Z',
          rrule: 'FREQ=WEEKLY;COUNT=4',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        // Should have 4 weekly occurrences
        expect(events).toHaveLength(4);
      });

      test('should generate unique IDs for recurring event occurrences', () => {
        const ical = wrapInCalendar(createICalEvent({
          uid: 'recurring-event',
          summary: 'Recurring Event',
          dtstart: '20251201T100000Z',
          dtend: '20251201T110000Z',
          rrule: 'FREQ=DAILY;COUNT=3',
        }));

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        // All external_ids should be unique
        const ids = events.map(e => e.external_id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(events.length);
      });

      test('should only include occurrences within date range', () => {
        const ical = wrapInCalendar(createICalEvent({
          uid: 'long-recurring',
          summary: 'Long Running Event',
          dtstart: '20251101T100000Z',
          dtend: '20251101T110000Z',
          rrule: 'FREQ=WEEKLY;COUNT=20',
        }));

        // Only get December events
        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        // Should only have events in December (not all 20)
        for (const event of events) {
          const eventDate = new Date(event.start_time);
          expect(eventDate.getMonth()).toBe(11); // December is month 11
        }
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty calendar', () => {
        const ical = wrapInCalendar('');

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        expect(events).toHaveLength(0);
      });

      test('should handle events without summary', () => {
        const ical = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:no-summary
DTSTART:20251215T100000Z
DTEND:20251215T110000Z
END:VEVENT
END:VCALENDAR`;

        const rangeStart = new Date('2025-12-01');
        const rangeEnd = new Date('2025-12-31');

        const events = parseICalFeed(ical, rangeStart, rangeEnd);

        // Should either skip the event or use a default title
        // Implementation may vary
        expect(events.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('URL Normalization', () => {
    test('should convert webcal:// to https://', () => {
      const webcalUrl = 'webcal://example.com/calendar.ics';
      const result = normalizeCalendarUrl(webcalUrl);
      expect(result).toBe('https://example.com/calendar.ics');
    });

    test('should convert webcals:// to https://', () => {
      const webcalsUrl = 'webcals://example.com/calendar.ics';
      const result = normalizeCalendarUrl(webcalsUrl);
      expect(result).toBe('https://example.com/calendar.ics');
    });

    test('should leave https:// URLs unchanged', () => {
      const httpsUrl = 'https://example.com/calendar.ics';
      const result = normalizeCalendarUrl(httpsUrl);
      expect(result).toBe('https://example.com/calendar.ics');
    });

    test('should leave http:// URLs unchanged', () => {
      const httpUrl = 'http://example.com/calendar.ics';
      const result = normalizeCalendarUrl(httpUrl);
      expect(result).toBe('http://example.com/calendar.ics');
    });

    test('should handle Apple Calendar webcal URLs', () => {
      const appleUrl = 'webcal://p50-caldav.icloud.com/published/2/MTM1MTIxOTE2MTM1MTIxOQD6m39VTdWOsDZg5sEbq88';
      const result = normalizeCalendarUrl(appleUrl);
      expect(result).toBe('https://p50-caldav.icloud.com/published/2/MTM1MTIxOTE2MTM1MTIxOQD6m39VTdWOsDZg5sEbq88');
    });
  });
});
