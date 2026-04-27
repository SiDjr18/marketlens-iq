import { DatabaseZap, FileSpreadsheet, ShieldCheck, UploadCloud } from "lucide-react";
import type { ChangeEvent, DragEvent, RefObject } from "react";
import { useRef } from "react";
import { Button } from "../ui/Button";

type UploadDropzoneProps = {
  inputRef?: RefObject<HTMLInputElement>;
  onFile: (file: File) => void;
  compact?: boolean;
};

export function UploadDropzone({ inputRef, onFile, compact = false }: UploadDropzoneProps) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = inputRef ?? localInputRef;
  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    event.target.value = "";
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(event) => event.preventDefault()}
      className={`rounded-lg border border-dashed border-teal/40 bg-white p-8 shadow-soft ${compact ? "p-4" : ""}`}
    >
      <input ref={activeInputRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.json" className="hidden" onChange={onChange} />
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-teal/20 bg-teal-50 text-teal">
          {compact ? <FileSpreadsheet className="h-7 w-7" /> : <UploadCloud className="h-8 w-8" />}
        </div>
        <h2 className="mt-4 text-2xl font-black text-navy">Upload IMS, IQVIA, IPM, Excel, CSV, or JSON data</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Files are analyzed in your browser. The app maps pharma fields, checks data health, and only generates strategy when the data is reliable.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-slate-50 px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Private local parsing
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-slate-50 px-2.5 py-1">
            <DatabaseZap className="h-3.5 w-3.5 text-teal" />
            IMS/IQVIA exact schema
          </span>
        </div>
        <Button className="mt-5" variant="primary" onClick={() => activeInputRef.current?.click()}>
          Select Data File
        </Button>
      </div>
    </div>
  );
}
