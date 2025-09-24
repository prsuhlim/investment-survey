// src/state/checks.js
export function assertOptionA(list) {
  if (!Array.isArray(list)) throw new Error("List must be an array");
  if (list.length !== 30) throw new Error("Expected 30 screens total");

  const block = (b) => list.filter((x) => x.block === b);
  const b1 = block(1), b2 = block(2);
  if (b1.length !== 14 || b2.length !== 14) {
    throw new Error(`Blocks must be 14 + 14, got ${b1.length} + ${b2.length}`);
  }

  const ids = (arr, tag) =>
    arr.filter((x) => x.tag === tag).map((x) => `${x.s}/${x.rp}/${x.sd}`);
  const b1Pool = ids(b1, "POOL");
  const b2Pool = ids(b2, "POOL");
  if (new Set(b1Pool).size !== 12 || new Set(b2Pool).size !== 12) {
    throw new Error("Each block must have 12 unique core items");
  }

  const finals = list.filter((x) => x.tag === "FINAL");
  if (finals.length !== 2 || new Set(finals.map((x) => x.pi)).size !== 2) {
    throw new Error("Two finals required, one under each inflation");
  }
  return true;
}
