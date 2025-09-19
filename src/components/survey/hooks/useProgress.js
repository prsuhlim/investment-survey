import React from "react";
import { loadInt, saveString } from "../utils/storage";

/**
 * Manages: current index, maxVisitedIdx, and linear forward navigation.
 * Persists idx and maxVisitedIdx so a refresh resumes correctly.
 */
export default function useProgress(scenarios, rows) {
  const total = Array.isArray(scenarios) ? scenarios.length : 0;

  const idxKey = "progress_idx_v1";
  const maxKey = "progress_maxVisited_v1";

  const [idx, setIdx] = React.useState(() => {
    const v = loadInt(idxKey, 0);
    return Number.isFinite(v) && v >= 0 ? Math.min(v, Math.max(total - 1, 0)) : 0;
  });

  const [maxVisitedIdx, _setMaxVisitedIdx] = React.useState(() => {
    const v = loadInt(maxKey, 0);
    return Number.isFinite(v) && v >= 0 ? Math.min(v, Math.max(total - 1, 0)) : 0;
  });

  const setFurthestVisited = React.useCallback((updater) => {
    _setMaxVisitedIdx((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return Number.isFinite(next) ? Math.max(prev ?? 0, next) : prev;
    });
  }, []);

  React.useEffect(() => {
    saveString(idxKey, idx);
  }, [idx]);

  React.useEffect(() => {
    saveString(maxKey, maxVisitedIdx);
  }, [maxVisitedIdx]);

  React.useEffect(() => {
    // If scenario count changes (hot reload, config change), keep idx in range
    setIdx((i) => Math.min(i, Math.max(total - 1, 0)));
    _setMaxVisitedIdx((m) => Math.min(m, Math.max(total - 1, 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const goNextLinear = React.useCallback(() => {
    setIdx((i) => Math.min(i + 1, total)); // allow i === total to trigger "finished" screen
  }, [total]);

  return { idx, setIdx, setFurthestVisited, goNextLinear, maxVisitedIdx };
}
