'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,20}$/;

export function parseYouTubeId(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = segments[0] ?? null;
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v');
  } else if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live' || segments[0] === 'v') {
    id = segments[1] ?? null;
  } else {
    id = url.searchParams.get('v');
  }
  return id && VIDEO_ID_PATTERN.test(id) ? id : null;
}

export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function youTubeThumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return secs === 0 ? `${mins} min` : `${mins}:${String(secs).padStart(2, '0')}`;
}

export function YouTubePlayer({
  url,
  videoId,
  title,
  thumbnailUrl,
  durationSeconds,
  className,
}: {
  url?: string | null;
  videoId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  className?: string;
}) {
  const id = videoId ?? parseYouTubeId(url);
  const [playing, setPlaying] = useState(false);

  if (!id) {
    if (!url) return null;
    return (
      <button
        type="button"
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        className={cn(
          'group relative flex aspect-video w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white',
          className,
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
          <ExternalLink className="h-6 w-6" />
        </span>
      </button>
    );
  }

  if (playing) {
    return (
      <div className={cn('relative aspect-video w-full bg-black', className)}>
        <iframe
          src={youTubeEmbedUrl(id)}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  const thumb = thumbnailUrl ?? youTubeThumbUrl(id);
  const duration = formatDuration(durationSeconds);

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title}`}
      className={cn('group relative block aspect-video w-full overflow-hidden bg-surface-900', className)}
    >
      <Image src={thumb} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-90 transition-opacity group-hover:opacity-70" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:bg-black/60">
          <Play className="ml-0.5 h-6 w-6" />
        </span>
      </span>
      {duration ? (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">{duration}</span>
      ) : null}
    </button>
  );
}
