'use client';

import { useRef, useState } from 'react';
import { ListVideo, Play, ChevronRight } from 'lucide-react';
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/youtube-player';
import { formatTimestamp, type VideoSegment } from '@/lib/video-segments';
import { cn } from '@/lib/cn';

export function VideoSegments({
  segments,
  onSeek,
  activeStartSeconds,
  className,
  label = 'Chapter markers',
  collapsible = false,
}: {
  segments: VideoSegment[];
  onSeek?: (seconds: number) => void;
  activeStartSeconds?: number | null;
  className?: string;
  label?: string;
  /** Start closed. Used on the chapter hub, where the concept rows already
   *  carry the timings and a 14-section list would push Practise off-screen. */
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  if (!segments.length) return null;

  // Every marker being derived means the video has no creator chapters and the
  // split was computed from the chapter's concepts - say so instead of implying
  // these are published timestamps.
  const approximate = segments.every((segment) => segment.derived === true);
  const heading = approximate ? `${label} · approximate` : label;

  return (
    <div className={className}>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-surface-400 transition-colors hover:text-brand-600"
        >
          <span className="inline-flex items-center gap-1.5">
            <ListVideo className="h-3.5 w-3.5" />
            {heading}
            <span className="font-normal normal-case text-surface-400">
              · {segments.length} section{segments.length === 1 ? '' : 's'}
            </span>
          </span>
          <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-surface-400">
          <ListVideo className="h-3.5 w-3.5" />
          {heading}
        </div>
      )}
      {open ? (
        <div role="group" aria-label={heading} className="mt-2 flex flex-col gap-1.5">
          {segments.map((segment) => {
            const active = activeStartSeconds === segment.startSeconds;
            return (
              <button
                key={segment.startSeconds}
                type="button"
                onClick={() => onSeek?.(segment.startSeconds)}
                title={segment.title}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors',
                  active
                    ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
                )}
              >
                <span className="w-11 shrink-0 font-mono text-[10px] tabular-nums text-surface-400">
                  {formatTimestamp(segment.startSeconds)}
                </span>
                <span className="flex-1 leading-snug">{segment.title}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function VideoWithSegments({
  url,
  videoId,
  title,
  thumbnailUrl,
  durationSeconds,
  segments,
  startSeconds,
  autoPlay,
  className,
  label = 'Sections',
  collapsible = false,
}: {
  url?: string | null;
  videoId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  segments: VideoSegment[];
  /** Open the lesson at this timestamp (a concept row deep link). */
  startSeconds?: number | null;
  autoPlay?: boolean;
  className?: string;
  label?: string;
  collapsible?: boolean;
}) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const initialStart =
    typeof startSeconds === 'number' && Number.isFinite(startSeconds) && startSeconds > 0
      ? Math.floor(startSeconds)
      : 0;
  const [fromStart, setFromStart] = useState(false);
  const effectiveStart = fromStart ? 0 : initialStart;
  const [activeStart, setActiveStart] = useState<number | null>(initialStart > 0 ? initialStart : null);

  const handleSeek = (seconds: number) => {
    setActiveStart(seconds);
    playerRef.current?.seekTo(seconds);
  };

  return (
    <div className={className}>
      {initialStart > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
            <Play className="h-3 w-3" />
            Starting at {formatTimestamp(effectiveStart)}
          </span>
          {!fromStart ? (
            <button
              type="button"
              onClick={() => setFromStart(true)}
              className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
            >
              Play from the start
            </button>
          ) : null}
        </div>
      ) : null}
      <YouTubePlayer
        key={`${title}-${effectiveStart}`}
        ref={playerRef}
        url={url}
        videoId={videoId}
        title={title}
        thumbnailUrl={thumbnailUrl}
        durationSeconds={durationSeconds}
        startSeconds={effectiveStart}
        autoPlay={autoPlay === true || initialStart > 0}
      />
      <VideoSegments
        segments={segments}
        onSeek={handleSeek}
        activeStartSeconds={activeStart}
        className="px-4 pt-3"
        label={label}
        collapsible={collapsible}
      />
    </div>
  );
}
