import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
};

export function Modal({ title, open, onClose, children, widthClass = "max-w-3xl" }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/35 p-4">
      <div className={`max-h-[90vh] w-full ${widthClass} overflow-hidden rounded-2xl border border-border bg-white shadow-panel`}>
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-56px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
