'use client';

import { useRef, useState } from 'react';
import { ListVideo } from 'lucide-react';
import { YouTubePlayer, type YouTubePlayerHandle } from '@/components/youtube-player';
import { formatTimestamp, type VideoSegment } from '@/lib/video-segments';
import { cn } from '@/lib/cn';

export function VideoSegments({
  segments,
  onSeek,
  activeStartSeconds,
  className,
  label = 'Chapter markers',
}: {
  segments: VideoSegment[];
  onSeek?: (seconds: number) => void;
  activeStartSeconds?: number | null;
  className?: string;
  label?: string;
}) {
  if (!segments.length) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-surface-400">
        <ListVideo className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        role="group"
        aria-label={label}
        className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
      >
        {segments.map((segment) => {
          const active = activeStartSeconds === segment.startSeconds;
          return (
            <button
              key={segment.startSeconds}
              type="button"
              onClick={() => onSeek?.(segment.startSeconds)}
              title={segment.title}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                active
                  ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-surface-200 bg-white text-surface-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
              )}
            >
              <span className="font-mono text-[10px] text-surface-400">
                {formatTimestamp(segment.startSeconds)}
              </span>
              <span className="max-w-[180px] truncate">{segment.title}</span>
            </button>
          );
        })}
      </div>
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
  className,
}: {
  url?: string | null;
  videoId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  segments: VideoSegment[];
  className?: string;
}) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [activeStart, setActiveStart] = useState<number | null>(null);

  const handleSeek = (seconds: number) => {
    setActiveStart(seconds);
    playerRef.current?.seekTo(seconds);
  };

  return (
    <div className={className}>
      <YouTubePlayer
        ref={playerRef}
        url={url}
        videoId={videoId}
        title={title}
        thumbnailUrl={thumbnailUrl}
        durationSeconds={durationSeconds}
      />
      <VideoSegments
        segments={segments}
        onSeek={handleSeek}
        activeStartSeconds={activeStart}
        className="px-4 pt-3"
      />
    </div>
  );
}
