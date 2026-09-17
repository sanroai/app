'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Boxes, Maximize2, RefreshCw, Rotate3d, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ArHotspot } from '@/lib/ar-hooks';

const MODEL_VIEWER_SCRIPT = 'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js';

const HOTSPOT_STYLE = `
model-viewer [slot^="hotspot"] {
  background: #7c3aed;
  border: 2px solid #ffffff;
  border-radius: 9999px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(76, 29, 149, 0.35);
  transform: translateY(-50%);
}
`;

let viewerScriptPromise: Promise<void> | null = null;

function loadModelViewer(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (customElements.get('model-viewer')) return Promise.resolve();
  if (viewerScriptPromise) return viewerScriptPromise;
  viewerScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the 3D viewer library'));
    document.head.appendChild(script);
  });
  return viewerScriptPromise;
}

export interface Model3DViewerProps {
  src?: string | null;
  poster?: string | null;
  alt: string;
  hotspots?: ArHotspot[] | null;
  className?: string;
  onReady?: () => void;
  onError?: () => void;
  activeHotspot?: string | null;
  onHotspotSelect?: (hotspot: ArHotspot) => void;
}

export function Model3DViewer({
  src,
  poster,
  alt,
  hotspots,
  className,
  onReady,
  onError,
  activeHotspot,
  onHotspotSelect,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setStatus('loading');
    loadModelViewer()
      .then(() => {
        if (!cancelled && viewerRef.current) onReady?.();
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          onError?.();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src, attempt, onReady, onError]);

  const resetCamera = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = '0deg 75deg 105%';
    viewer.cameraTarget = 'auto auto auto';
    viewer.fieldOfView = 'auto';
  }, []);

  const goFullscreen = useCallback(() => {
    containerRef.current?.requestFullscreen?.().catch(() => undefined);
  }, []);

  if (!src) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-300 bg-surface-50 py-16 text-center">
          <Boxes className="h-10 w-10 text-surface-400" />
          <p className="text-sm font-medium text-surface-700">3D model unavailable</p>
          <p className="max-w-sm text-xs text-surface-500">
            The interactive model for this concept has not been attached yet. You can still read the explanation and
            complete the quick check.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <style dangerouslySetInnerHTML={{ __html: HOTSPOT_STYLE }} />
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-surface-200 bg-gradient-to-b from-surface-50 to-white"
      >
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-surface-600 shadow-sm">
          <Rotate3d className="h-3.5 w-3.5 text-brand-600" />
          Drag to rotate - scroll to zoom
        </div>

        {status === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
              <span className="text-xs text-surface-500">Loading 3D model...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Boxes className="h-9 w-9 text-surface-400" />
              <p className="text-sm font-medium text-surface-800">The 3D viewer could not start</p>
              <p className="max-w-sm text-xs text-surface-500">
                This is usually a network problem. Your learning content is still available below the model.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  viewerScriptPromise = null;
                  setAttempt((a) => a + 1);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          </div>
        )}

        {(() => {
          const ModelViewer: any = 'model-viewer';
          return (
            <ModelViewer
              ref={viewerRef}
              src={src}
              poster={poster ?? undefined}
              alt={alt}
              camera-controls=""
              touch-action="pan-y"
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              shadow-intensity="1"
              exposure="1"
              style={{ width: '100%', height: '360px', backgroundColor: 'transparent' }}
              onLoad={() => setStatus('ready')}
              onError={() => {
                setStatus('error');
                onError?.();
              }}
            >
              {(hotspots ?? []).map((hotspot) => (
                <button
                  key={hotspot.id}
                  slot={`hotspot-${hotspot.id}`}
                  data-position={hotspot.position.join(' ')}
                  type="button"
                  onClick={() => onHotspotSelect?.(hotspot)}
                  style={{ opacity: activeHotspot && activeHotspot !== hotspot.id ? 0.45 : 1 }}
                >
                  {hotspot.label}
                </button>
              ))}
              <button slot="ar-button" className="absolute bottom-3 right-3 z-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                  <Smartphone className="h-4 w-4" /> View in your space
                </span>
              </button>
            </ModelViewer>
          );
        })()}

        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-xl bg-white/90" onClick={resetCamera}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reset
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl bg-white/90" onClick={goFullscreen} aria-label="Fullscreen">
            <Maximize2 className="mr-2 h-3.5 w-3.5" /> Fullscreen
          </Button>
        </div>
      </div>
    </div>
  );
}
