// src/state/rng.js
// Deterministic RNG with sub-seeding for reproducible, independent draws.

function hashStringToInt(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seedInt) {
  let t = seedInt >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const base =
    typeof seed === "number" ? seed : hashStringToInt(String(seed ?? "seed"));
  const rand = mulberry32(base);
  const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const derive = (label) => makeRng(`${base}:${label}`);
  return { rand, pickOne, shuffle, derive };
}

export function shuffleInPlace(arr, rngFn = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rngFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
