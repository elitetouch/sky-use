"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Tone = "danger" | "default";

type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
};

type AlertOptions = {
  title: string;
  message?: ReactNode;
  okLabel?: string;
  tone?: Tone;
};

type DialogApi = {
  /** Branded replacement for window.confirm — resolves true when confirmed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Branded replacement for window.alert — resolves when dismissed. */
  alert: (options: AlertOptions) => Promise<void>;
};

type Pending = {
  kind: "confirm" | "alert";
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  tone: Tone;
  resolve: (value: boolean) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used inside <DialogProvider>.");
  }
  return ctx;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);

  const open = useCallback((next: Omit<Pending, "resolve">) => {
    return new Promise<boolean>((resolve) => {
      // Only one dialog at a time: an older one is treated as cancelled.
      pendingRef.current?.resolve(false);
      const entry = { ...next, resolve };
      pendingRef.current = entry;
      setPending(entry);
    });
  }, []);

  const close = useCallback((result: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    current?.resolve(result);
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
    confirm: (o) =>
      open({
        kind: "confirm",
        title: o.title,
        message: o.message,
        confirmLabel: o.confirmLabel ?? "Confirm",
        cancelLabel: o.cancelLabel ?? "Cancel",
        tone: o.tone ?? "default",
      }),
    alert: (o) =>
      open({
        kind: "alert",
        title: o.title,
        message: o.message,
        confirmLabel: o.okLabel ?? "OK",
        cancelLabel: "",
        tone: o.tone ?? "default",
      }).then(() => undefined),
    }),
    [open],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {pending ? <DialogView pending={pending} onClose={close} /> : null}
    </DialogContext.Provider>
  );
}

function DialogView({ pending, onClose }: { pending: Pending; onClose: (result: boolean) => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const isDanger = pending.tone === "danger";
  const isConfirm = pending.kind === "confirm";

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Destructive confirms focus Cancel so a stray Enter doesn't delete anything.
    (isConfirm && isDanger ? cancelRef.current : confirmRef.current)?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(!isConfirm);
        return;
      }
      if (event.key === "Tab" && panelRef.current) {
        // Keep keyboard focus inside the dialog.
        const focusable = panelRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isConfirm, isDanger, onClose]);

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(!isConfirm);
      }}
    >
      <div
        ref={panelRef}
        role={isConfirm ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby={pending.message ? "app-dialog-message" : undefined}
        className="dialog-panel w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex gap-4">
          <span
            aria-hidden
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              isDanger ? "bg-red/10 text-red" : "bg-navy/10 text-navy"
            }`}
          >
            {isDanger ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path
                  d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8h.01M11 12h1v5h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="app-dialog-title" className="text-lg font-bold text-navy">
              {pending.title}
            </h2>
            {pending.message ? (
              <div id="app-dialog-message" className="mt-1.5 text-sm leading-relaxed text-body">
                {pending.message}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isConfirm ? (
            <button
              ref={cancelRef}
              type="button"
              onClick={() => onClose(false)}
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
            >
              {pending.cancelLabel}
            </button>
          ) : null}
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDanger
                ? "bg-red hover:bg-red-light focus-visible:ring-red/50"
                : "bg-navy hover:bg-navy-light focus-visible:ring-navy/50"
            }`}
          >
            {pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
