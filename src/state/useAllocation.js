// src/state/useAllocation.js
import React from "react";
import { clamp } from "./math";

/**
 * Slider + input interaction, gating, and keyboard/pointer handlers
 * Robust: does not assume cfg is provided; no conditional hooks.
 */
export default function useAllocation({
  cfg,
  cur,
  isConfirmed = false,
  isViewingPast = false,
  onTouched = () => {},
}) {
  const snap = 1;

  const defaultB = Number.isFinite(Number(cfg?.defaultB)) ? Number(cfg.defaultB) : 50;

  const [panelUnlocked, setPanelUnlocked] = React.useState(false);
  const [value, _setValue] = React.useState(() =>
    clamp(Math.round(defaultB / snap) * snap, 0, 100)
  );
  const [hasTouched, setHasTouched] = React.useState(false);

  const unlock = React.useCallback(() => setPanelUnlocked(true), []);
  const setValue = React.useCallback(
    (v) => {
      setHasTouched(true);
      onTouched();
      _setValue(clamp(Math.round((Number(v) || 0) / snap) * snap, 0, 100));
    },
    [snap, onTouched]
  );

  // Reset on scenario/inflation change (always runs)
  React.useEffect(() => {
    setPanelUnlocked(false);
    setHasTouched(false);
    if (isConfirmed && cur && Number.isFinite(Number(cur.risky_share))) {
      _setValue(clamp(Math.round((Number(cur.risky_share) || 0) / snap) * snap, 0, 100));
    } else {
      _setValue(clamp(Math.round(defaultB / snap) * snap, 0, 100));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id, cur?.pi, isConfirmed, defaultB]);

  const barRef = React.useRef(null);
  const draggingRef = React.useRef(false);

  const pctFromClientX = (clientX) => {
    const el = barRef.current;
    if (!el || typeof clientX !== "number" || Number.isNaN(clientX)) return 100 - value;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    return Math.round((x / rect.width) * 100);
  };

  const controlsLocked  = isConfirmed || !panelUnlocked || isViewingPast;
  const confirmDisabled = controlsLocked || !hasTouched;

  const onBarPointerDown = (e) => {
    if (!e || controlsLocked) return;
    setHasTouched(true);
    draggingRef.current = true;
    const cx = typeof e.clientX === "number" ? e.clientX : (e.touches?.[0]?.clientX ?? null);
    setValue(100 - pctFromClientX(cx));
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("touchmove", onWindowTouchMove, { passive: false });
    window.addEventListener("touchend", onWindowTouchEnd);
  };

  const onWindowPointerMove = (e) => {
    if (draggingRef.current) setValue(100 - pctFromClientX(e?.clientX));
  };
  const onWindowPointerUp = () => {
    draggingRef.current = false;
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
  };
  const onWindowTouchMove = (e) => {
    if (!draggingRef.current) return;
    if (e?.cancelable) e.preventDefault();
    const t = e?.touches?.[0];
    const cx = t?.clientX ?? null;
    setValue(100 - pctFromClientX(cx));
  };
  const onWindowTouchEnd = () => {
    draggingRef.current = false;
    window.removeEventListener("touchmove", onWindowTouchMove);
    window.removeEventListener("touchend", onWindowTouchEnd);
  };

  const onHandleKeyDown = (e) => {
    if (controlsLocked) return;
    setHasTouched(true);
    onTouched();
    const step = e?.shiftKey ? 10 * snap : snap;
    if (e?.key === "ArrowLeft")      { setValue(value - step); e.preventDefault(); }
    else if (e?.key === "ArrowRight"){ setValue(value + step); e.preventDefault(); }
    else if (e?.key === "Home")      { setValue(100);          e.preventDefault(); }
    else if (e?.key === "End")       { setValue(0);            e.preventDefault(); }
  };

  return {
    panelUnlocked,
    unlock,
    value,
    setValue,
    hasTouched,
    controlsLocked,
    confirmDisabled,
    barRef,
    onBarPointerDown,
    onHandleKeyDown,
    highlight: false,
  };
}
