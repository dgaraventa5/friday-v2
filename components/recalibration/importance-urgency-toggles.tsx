'use client';

import { Button } from '@/components/ui/button';
import { getQuadrantLabel } from '@/lib/utils/recalibration-utils';

interface ImportanceUrgencyTogglesProps {
  importance: 'important' | 'not-important';
  urgency: 'urgent' | 'not-urgent';
  onImportanceChange: (value: 'important' | 'not-important') => void;
  onUrgencyChange: (value: 'urgent' | 'not-urgent') => void;
  compact?: boolean;
}

export function ImportanceUrgencyToggles({
  importance,
  urgency,
  onImportanceChange,
  onUrgencyChange,
  compact = false,
}: ImportanceUrgencyTogglesProps) {
  const quadrant = getQuadrantLabel(importance, urgency);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Important?</span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={importance === 'important' ? 'default' : 'outline'}
              onClick={() => onImportanceChange('important')}
              className="text-xs h-7 px-2"
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={importance === 'not-important' ? 'default' : 'outline'}
              onClick={() => onImportanceChange('not-important')}
              className="text-xs h-7 px-2"
            >
              No
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Urgent?</span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={urgency === 'urgent' ? 'default' : 'outline'}
              onClick={() => onUrgencyChange('urgent')}
              className="text-xs h-7 px-2"
            >
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={urgency === 'not-urgent' ? 'default' : 'outline'}
              onClick={() => onUrgencyChange('not-urgent')}
              className="text-xs h-7 px-2"
            >
              No
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Current: <span className="font-medium text-foreground">{quadrant.label}</span>{' '}
          <span className="text-muted-foreground">({quadrant.sublabel})</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Important?</span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={importance === 'important' ? 'default' : 'outline'}
            onClick={() => onImportanceChange('important')}
          >
            Yes
          </Button>
          <Button
            type="button"
            size="sm"
            variant={importance === 'not-important' ? 'default' : 'outline'}
            onClick={() => onImportanceChange('not-important')}
          >
            No
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Urgent?</span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={urgency === 'urgent' ? 'default' : 'outline'}
            onClick={() => onUrgencyChange('urgent')}
          >
            Yes
          </Button>
          <Button
            type="button"
            size="sm"
            variant={urgency === 'not-urgent' ? 'default' : 'outline'}
            onClick={() => onUrgencyChange('not-urgent')}
          >
            No
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Current: <span className="font-medium text-foreground">{quadrant.label}</span>{' '}
        <span className="text-muted-foreground">({quadrant.sublabel})</span>
      </div>
    </div>
  );
}
