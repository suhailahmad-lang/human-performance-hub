import { createElement, useEffect, useRef, useState, type ElementType, type RefObject } from "react";
import { Pause, Play, RotateCcw, Gauge, Cuboid } from "lucide-react";

type ModelViewerElement = HTMLElement & {
  play?: () => void;
  pause?: () => void;
  currentTime?: number;
  duration?: number;
  animationName?: string;
  playbackRate?: number;
};

interface Exercise3DAnimationProps {
  exerciseSlug: string;
  exerciseName: string;
}

const MODEL_VIEWER_SCRIPT =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.5/model-viewer.min.js";

/**
 * Exercise-specific GLB assets are registered here after they have been
 * generated, rigged, reviewed and uploaded to the platform's asset storage.
 * Never point multiple exercises at a generic clip.
 */
const EXERCISE_3D_ASSETS: Record<
  string,
  { src: string; animationName?: string; label: string }
> = {};

export function Exercise3DAnimation({
  exerciseSlug,
  exerciseName,
}: Exercise3DAnimationProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const asset = EXERCISE_3D_ASSETS[exerciseSlug];
  const assetSrc = asset?.src;

  useEffect(() => {
    // Do not download the viewer runtime on exercise pages that have no
    // verified, durable GLB asset registered yet.
    if (!assetSrc) return;

    let cancelled = false;
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-exercise-model-viewer="true"]',
    );

    const markReady = () => {
      if (cancelled) return;
      setViewerReady(true);
      setViewerError(false);
    };
    const markFailed = () => {
      if (cancelled) return;
      setViewerReady(false);
      setViewerError(true);
    };
    const onScriptLoad = () => {
      void customElements.whenDefined("model-viewer").then(markReady);
    };

    setViewerReady(false);
    setViewerError(false);
    const timeoutId = window.setTimeout(markFailed, 15_000);

    if (customElements.get("model-viewer")) {
      markReady();
    } else if (existing) {
      existing.addEventListener("load", onScriptLoad);
      existing.addEventListener("error", markFailed);
      // Also handles a shared script whose load event fired before this
      // component mounted.
      void customElements.whenDefined("model-viewer").then(markReady);
    } else {
      const script = document.createElement("script");
      script.type = "module";
      script.src = MODEL_VIEWER_SCRIPT;
      script.dataset.exerciseModelViewer = "true";
      script.addEventListener("load", onScriptLoad, { once: true });
      script.addEventListener("error", markFailed, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      existing?.removeEventListener("load", onScriptLoad);
      existing?.removeEventListener("error", markFailed);
    };
  }, [assetSrc]);

  useEffect(() => {
    setPlaying(false);
    setSpeed(1);
  }, [exerciseSlug]);

  function togglePlayback() {
    const viewer = viewerRef.current;
    if (!viewer || !asset) return;
    if (playing) {
      viewer.pause?.();
      setPlaying(false);
    } else {
      viewer.play?.();
      setPlaying(true);
    }
  }

  function replay() {
    const viewer = viewerRef.current;
    if (!viewer || !asset) return;
    viewer.pause?.();
    viewer.currentTime = 0;
    viewer.play?.();
    setPlaying(true);
  }

  function changeSpeed(nextSpeed: number) {
    setSpeed(nextSpeed);
    if (viewerRef.current) {
      viewerRef.current.playbackRate = nextSpeed;
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <p className="eyebrow">Interactive movement lab</p>
          <h2 className="mt-1 text-lg font-semibold">3D exercise demonstration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Exercise-specific 3D movement preview for {exerciseName}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1 text-xs text-primary">
          <Cuboid className="size-3.5" /> {asset ? "3D GLB" : "3D asset pending"}
        </span>
      </div>

      {asset ? (
        <>
          <div className="relative min-h-[320px] bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.12),transparent_65%)]">
            {ReactModelViewer({
              viewerRef,
              src: asset.src,
              animationName: asset.animationName,
              ready: viewerReady,
            })}
            {!viewerReady && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
                {viewerError
                  ? "The 3D viewer could not be loaded. Check your connection and try again later."
                  : "Loading 3D viewer…"}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
            <button type="button" onClick={togglePlayback} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={replay} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              <RotateCcw className="size-4" /> Replay
            </button>
            <label className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="size-4" />
              <select aria-label="Animation speed" value={speed} onChange={(event) => changeSpeed(Number(event.target.value))} className="rounded-md border border-border bg-background px-2 py-1.5 text-foreground">
                <option value={0.5}>0.5×</option>
                <option value={0.75}>0.75×</option>
                <option value={1}>1×</option>
                <option value={1.25}>1.25×</option>
                <option value={1.5}>1.5×</option>
              </select>
            </label>
          </div>
        </>
      ) : (
        <div className="grid min-h-[300px] place-items-center p-8 text-center">
          <div className="max-w-md">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
              <Cuboid className="size-8" />
            </div>
            <h3 className="mt-4 font-semibold">3D movement asset pending</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This exercise does not have a verified, exercise-specific rigged 3D animation asset yet.
              A generic animation or external video will not be substituted.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Asset pipeline: character mesh → humanoid rig → exercise motion clip → review → platform GLB.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ReactModelViewer({
  viewerRef,
  src,
  animationName,
  ready,
}: {
  viewerRef: RefObject<ModelViewerElement | null>;
  src: string;
  animationName?: string;
  ready: boolean;
}) {
  const tag = "model-viewer" as ElementType;
  return createElement(tag, {
    ref: viewerRef,
    src,
    "animation-name": animationName,
    autoplay: false,
    loop: true,
    "camera-controls": true,
    "shadow-intensity": "0.8",
    exposure: "1",
    "environment-image": "neutral",
    "interaction-prompt": "none",
    style: {
      display: "block",
      width: "100%",
      height: "340px",
      background: "transparent",
      opacity: ready ? 1 : 0,
    },
  });
}
