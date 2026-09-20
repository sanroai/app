import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const SOURCE_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  INSTITUTION: {
    label: 'Institution',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  DIRECT_SANRO: {
    label: 'Direct SANRO',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};

export function SourceBadge({
  source,
  className,
}: {
  source?: string | null;
  className?: string;
}) {
  const meta = SOURCE_STYLES[source ?? ''] ?? SOURCE_STYLES.INSTITUTION;
  return (
    <Badge variant="outline" className={cn('text-[10px]', meta.className, className)}>
      {meta.label}
    </Badge>
  );
}