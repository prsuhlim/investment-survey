import React from "react";
import { buildRespondentSurveyFixed } from "../../pool";

/**
 * Build scenarios via pool.js with a safe fallback to a single baseline
 */
export default function useScenarios(cfg) {
  return React.useMemo(() => {
    try {
      const built = buildRespondentSurveyFixed({
        seedRespondent: cfg.poolseed,
        groupKey: (cfg.group === "A" || cfg.group === "B" || cfg.group === "C") ? cfg.group : null,
        blockOrder: cfg.order,      // [0,6] or [6,0] or null
        storageTag: cfg.pooltag,
      });
      if (!Array.isArray(built) || built.length === 0) throw new Error("Empty scenarios");
      return built;
    } catch (e) {
      console.error("[useScenarios] Fallback to baseline. Error:", e);
      return [{
        id: "FALLBACK_BASE",
        order: 1,
        tag: "BASE",
        s: 2, u: 5, d: -1, p: 0.5, pi: 0,
        isBaseline: true, isSanity: false, isLast: false, isMirror: false,
      }];
    }
  }, [cfg.poolseed, cfg.group, cfg.order, cfg.pooltag]);
}
