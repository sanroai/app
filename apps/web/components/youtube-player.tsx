'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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

export function youTubeEmbedUrl(videoId: string, origin?: string | null): string {
  // cc_load_policy=0 keeps captions off - without it the embed follows the viewer's
  // own YouTube caption preference and can subtitle over the lesson.
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    cc_load_policy: '0',
    hl: 'en',
  });
  // YouTube only accepts postMessage commands (seekTo) when the embed knows the
  // page origin, so the origin travels with the embed URL.
  if (origin) params.set('origin', origin);
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
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

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
}

function isYouTubeOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return (
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com')
    );
  } catch {
    return false;
  }
}

type YouTubeMessage = { event?: string; info?: { currentTime?: number } };

function parseYouTubeMessage(data: unknown): YouTubeMessage | null {
  let payload: unknown = data;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }
  if (typeof payload !== 'object' || payload === null) return null;
  return payload as YouTubeMessage;
}

export const YouTubePlayer = forwardRef<
  YouTubePlayerHandle,
  {
    url?: string | null;
    videoId?: string | null;
    title: string;
    thumbnailUrl?: string | null;
    durationSeconds?: number | null;
    className?: string;
  }
>(function YouTubePlayer(
  { url, videoId, title, thumbnailUrl, durationSeconds, className },
  ref,
) {
  const id = videoId ?? parseYouTubeId(url);
  const [playing, setPlaying] = useState(false);
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  const [seekNonce, setSeekNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const postSeek = useCallback((seconds: number) => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return false;
    target.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds] }),
      '*',
    );
    return true;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      seekTo(seconds: number) {
        if (!Number.isFinite(seconds) || seconds < 0) return;
        const target = Math.floor(seconds);
        setPlaying(true);
        if (readyRef.current) {
          // The embed already answered, so the command lands straight away and
          // no retry is needed.
          pendingSeekRef.current = null;
          postSeek(target);
          return;
        }
        pendingSeekRef.current = target;
        setSeekNonce((n) => n + 1);
        postSeek(target);
      },
    }),
    [postSeek],
  );

  // The embed boots asynchronously and drops commands sent before it is ready,
  // so a pending seek is repeated until YouTube answers.
  useEffect(() => {
    if (!playing || seekNonce === 0) return;
    let attempts = 0;
    const timer = setInterval(() => {
      const pending = pendingSeekRef.current;
      if (pending === null) {
        clearInterval(timer);
        return;
      }
      attempts += 1;
      postSeek(pending);
      if (attempts >= 3) clearInterval(timer);
    }, 600);
    return () => clearInterval(timer);
  }, [playing, seekNonce, postSeek]);

  useEffect(() => {
    if (!playing) return;
    const onMessage = (event: MessageEvent) => {
      if (!isYouTubeOrigin(event.origin)) return;
      const message = parseYouTubeMessage(event.data);
      if (!message) return;
      readyRef.current = true;
      const pending = pendingSeekRef.current;
      if (pending === null) return;
      const currentTime =
        typeof message.info?.currentTime === 'number' ? message.info.currentTime : null;
      if (currentTime !== null && Math.abs(currentTime - pending) <= 1.5) {
        pendingSeekRef.current = null;
        return;
      }
      postSeek(pending);
      pendingSeekRef.current = null;
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [playing, postSeek]);

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
          ref={iframeRef}
          src={youTubeEmbedUrl(id, origin)}
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
});

YouTubePlayer.displayName = 'YouTubePlayer';
