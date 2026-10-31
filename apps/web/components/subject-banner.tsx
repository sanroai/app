import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { subjectArt, subjectBannerFor } from '@/lib/subject-art';
import { cn } from '@/lib/cn';

/**
 * Three letters that stand for a subject ("SCI", "MAT", "ENG").
 *
 * The subject cards used to show a 3D PNG icon inside a white pill. Sentence
 * case names next to a small glossy object read as an emoji sticker, so the
 * tile is now designed: the subject's own photograph, its accent gradient and a
 * typographic monogram, with the name set large underneath.
 */
export function subjectMonogram(name: string, code?: string): string {
  const key = `${name} ${code ?? ''}`.toLowerCase();
  if (key.includes('scien') || key.includes('physics') || key.includes('chemis') || key.includes('biolog')) return 'SCI';
  if (key.includes('math') || key.includes('ganit')) return 'MAT';
  if (key.includes('english') || key.includes('literature')) return 'ENG';
  if (key.includes('hindi')) return 'HIN';
  if (key.includes('sanskrit')) return 'SAN';
  if (key.includes('social') || key.includes('history') || key.includes('geograph') || key.includes('civic')) return 'SST';
  if (key.includes('art') || key.includes('craft')) return 'ART';
  return (code || name).replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'SUB';
}

interface SubjectBannerProps {
  name: string;
  code?: string;
  /** The class this tile belongs to; each class gets its own framing + numeral. */
  grade?: string | number;
  /** The line under the name ("Class 10 · 40 lessons"). */
  subtitle?: string;
  sizes?: string;
  /** Tailwind aspect class for the tile - a wide banner when used as a header. */
  aspect?: string;
  /**
   * Set false when the card prints the name under the picture: lesson frames
   * already carry their own captions, and two titles on one image collide.
   */
  showName?: boolean;
  showChevron?: boolean;
}

/** The shared subject thumbnail: photograph, accent wash, monogram, name. */
export function SubjectBanner({
  name,
  code,
  grade,
  subtitle,
  sizes,
  aspect = 'aspect-[16/9]',
  showName = true,
  showChevron = true,
}: SubjectBannerProps) {
  const art = subjectArt(name, code);
  const src = subjectBannerFor(art, grade);
  return (
    <div className={cn('relative w-full overflow-hidden bg-surface-900', aspect)}>
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes ?? '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px'}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{ background: `linear-gradient(135deg, ${art.accent}, ${art.accent2})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <span className="absolute left-4 top-4 inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border border-white/35 bg-white/15 px-2 text-[13px] font-extrabold tracking-[0.08em] text-white backdrop-blur-sm">
        {subjectMonogram(name, code)}
      </span>
      {showName ? (
        <div className="absolute inset-x-0 bottom-0 p-4 pr-14">
          <h4 className="truncate font-display text-[17px] font-bold leading-tight text-white drop-shadow">
            {name}
          </h4>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] font-medium text-white/75">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {grade !== undefined && grade !== null ? (
        <span
          aria-hidden="true"
          className="absolute bottom-2 right-3 select-none font-display text-[38px] font-black leading-none text-white/25"
        >
          {grade}
        </span>
      ) : null}
      {showChevron ? (
        <ChevronRight className="absolute right-3 top-4 h-4 w-4 text-white/80 transition-transform group-hover:translate-x-0.5" />
      ) : null}
    </div>
  );
}
