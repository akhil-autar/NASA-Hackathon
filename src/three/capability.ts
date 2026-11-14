import { useEffect, useRef, useState } from "react";
import { loadJson, saveJson } from "../storage/local";

// ---------------------------------------------------------------------------
// Can this device show the 3D scenes? Every scene sits on top of a still
// image, so whenever the answer is "no" the child simply sees the still.
// ---------------------------------------------------------------------------

const GRAPHICS_KEY = "graphics3d";

/** The player's own switch (Settings > 3D graphics). Default on. */
export function load3DSetting(): boolean {
  return loadJson<boolean>(GRAPHICS_KEY, true);
}

export function save3DSetting(on: boolean): void {
  saveJson(GRAPHICS_KEY, on);
  window.dispatchEvent(new Event("solwatch:graphics"));
}

let webglCache: boolean | null = null;

/** True when the browser can create a WebGL context. Checked once. */
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    webglCache = !!gl;
  } catch {
    webglCache = false;
  }
  return webglCache;
}

/** Follows the device's "reduce motion" preference. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/**
 * Should we mount a 3D canvas at all? No when WebGL is missing, the device
 * asks for reduced motion, or the player switched 3D off in Settings.
 */
export function useCan3D(): boolean {
  const reduced = useReducedMotion();
  const [setting, setSetting] = useState(load3DSetting);
  useEffect(() => {
    const onChange = () => setSetting(load3DSetting());
    window.addEventListener("solwatch:graphics", onChange);
    return () => window.removeEventListener("solwatch:graphics", onChange);
  }, []);
  return setting && !reduced && hasWebGL();
}

/**
 * True while the element is on screen and the tab is visible. Scenes stop
 * rendering when this is false, which saves battery on phones.
 */
export function useActive<T extends Element>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return [ref, inView && tabVisible];
}

/** A small-screen check used to lower detail on phones. */
export function isSmallScreen(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 600;
}
