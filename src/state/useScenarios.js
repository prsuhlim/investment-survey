// src/state/useScenarios.js
import React from "react";
import { buildSurveyFlow } from "./pool";
import { saveString } from "./storage";

export default function useScenarios() {
  const [state, setState] = React.useState({ list: [], ready: false, meta: null });

  React.useEffect(() => {
    const url = new URL(window.location.href);

    const seed =
      url.searchParams.get("poolseed") ||
      (crypto?.randomUUID?.() ?? String(Date.now()));

    const group = (url.searchParams.get("group") || "").toUpperCase();
    const orderStr = url.searchParams.get("order");
    const blockOrder = orderStr
      ? orderStr.split(",").map((n) => Number(n)).filter((n) => n === 0 || n === 6)
      : undefined;

    try { saveString("poolseed_v1", seed); } catch {}

    const { list, meta } = buildSurveyFlow(seed, {
      groupKey: group === "A" || group === "B" || group === "C" ? group : undefined,
      blockOrder: Array.isArray(blockOrder) && blockOrder.length === 2 ? blockOrder : undefined,
    });

    setState({
      list,
      ready: true,
      // include both "seed" and "poolseed" so older code keeps working
      meta: { ...(meta || {}), seed, poolseed: seed },
    });
  }, []);

  return state; // { list, ready, meta }
}
