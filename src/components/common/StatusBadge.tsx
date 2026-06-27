type StatusTone = 'gray' | 'blue' | 'green' | 'orange' | 'red';

interface StatusBadgeProps {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  orange: 'bg-orange-50 text-orange-700',
  red: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status, label, tone, className = '' }: StatusBadgeProps) {
  const resolvedTone = tone || toneForStatus(status);
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${toneClasses[resolvedTone]} ${className}`}>
      {label || humanizeStatus(status)}
    </span>
  );
}

function toneForStatus(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (['active', 'submitted', 'published', 'synced', 'known', 'ready'].includes(normalized)) return 'green';
  if (['draft', 'local', 'syncing', 'selected', 'familiar'].includes(normalized)) return 'blue';
  if (['short', 'belowminimum', 'needsattention', 'pending', 'discussed'].includes(normalized.replace(/\s+/g, ''))) return 'orange';
  if (['failed', 'removed', 'hidden', 'offline', 'error'].includes(normalized)) return 'red';
  return 'gray';
}

function humanizeStatus(status: string): string {
  return status
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, char => char.toUpperCase());
}
