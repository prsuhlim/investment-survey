import React from "react";
import { loadJSON, saveJSON } from "./storage";

export default function useLocalRows(storageName) {
  const [rows, setRows] = React.useState(() => {
    if (!storageName) return [];
    const saved = loadJSON(storageName, []);
    return Array.isArray(saved) ? saved : [];
  });

  React.useEffect(() => {
    if (!storageName) return;
    saveJSON(storageName, rows);
  }, [storageName, rows]);

  return [rows, setRows];
}
