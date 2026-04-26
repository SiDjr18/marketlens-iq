/// <reference lib="webworker" />
import Papa from "papaparse";
import type { RawRow } from "../utils/types";

type WorkerRequest = {
  file: File;
  delimiter?: string;
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { file, delimiter } = event.data;
  let rowsProcessed = 0;
  const rows: RawRow[] = [];
  const errors: string[] = [];

  Papa.parse<RawRow>(file, {
    header: true,
    delimiter,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
    chunk: (result) => {
      result.data.forEach((row) => {
        if (Object.values(row).some((value) => String(value ?? "").trim())) rows.push(row);
      });
      rowsProcessed = rows.length;
      self.postMessage({ type: "progress", rowsProcessed });
    },
    complete: (result) => {
      result.errors.forEach((error) => errors.push(`${error.message} at row ${error.row ?? "unknown"}`));
      self.postMessage({ type: "complete", rows, errors });
    },
    error: (error) => {
      self.postMessage({ type: "error", error: error.message });
    }
  });
};
