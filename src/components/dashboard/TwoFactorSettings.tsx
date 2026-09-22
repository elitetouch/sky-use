"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";

type Method = "totp" | "email" | null;
type Mode = "idle" | "setup-totp" | "setup-email";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

export function TwoFactorSettings({
  enabled,
  method,
}: {
  enabled: boolean;
  method: Method;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TOTP setup state
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");

  // Email setup state
  const [emailSent, setEmailSent] = useState(false);

  // Shown after enabling TOTP / regenerating
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  // Disable / regenerate
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!otpauthUri) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(otpauthUri, { width: 220, margin: 1 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [otpauthUri]);

  function reset() {
    setMode("idle");
    setError(null);
    setOtpauthUri(null);
    setSecret(null);
    setQr(null);
    setCode("");
    setEmailSent(false);
    setPassword("");
  }

  async function startTotp() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/totp", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Couldn't start setup.");
        return;
      }
      setOtpauthUri(json.data.otpauth_uri);
      setSecret(json.data.secret);
      setMode("setup-totp");
    } finally {
      setBusy(false);
    }
  }

  async function confirmTotp() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/totp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "That code is invalid.");
        return;
      }
      setRecoveryCodes(json.data.recovery_codes ?? []);
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function startEmail() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/email", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Couldn't send a code.");
        return;
      }
      setEmailSent(true);
      setMode("setup-email");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEmail() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "That code is invalid or has expired.");
        return;
      }
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Couldn't turn off two-factor.");
        return;
      }
      setRecoveryCodes(null);
      reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/recovery-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Couldn't regenerate codes.");
        return;
      }
      setRecoveryCodes(json.data.recovery_codes ?? []);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  // --- Recovery codes panel (shown after enabling / regenerating) ---
  const recoveryPanel = recoveryCodes ? (
    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
      <p className="text-sm font-semibold text-green-800">Save your recovery codes</p>
      <p className="mt-1 text-xs text-green-700">
        Each code works once. Keep them somewhere safe — you can use one to sign in if you lose your authenticator.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-navy">
        {recoveryCodes.map((c) => (
          <span key={c} className="rounded bg-white px-2 py-1 text-center">
            {c}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(recoveryCodes.join("\n"))}
        className="mt-3 text-xs font-semibold text-green-800 hover:underline"
      >
        Copy all
      </button>
    </div>
  ) : null;

  const errorBox = error ? <p className="mt-3 text-sm text-red">{error}</p> : null;

  // --- TOTP setup ---
  if (mode === "setup-totp") {
    return (
      <div>
        <h2 className="text-lg font-bold text-navy">Set up authenticator app</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-body">
          <li>Open Google Authenticator, Authy or 1Password.</li>
          <li>Scan this QR code (or enter the key manually).</li>
          <li>Enter the 6-digit code it shows to confirm.</li>
        </ol>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Authenticator QR code" className="h-48 w-48 rounded-lg border border-black/10" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-black/10 text-sm text-body">
              Generating…
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-body">Manual entry key</p>
            <code className="mt-1 block break-all rounded-lg bg-black/[0.04] px-3 py-2 font-mono text-sm text-navy">
              {secret}
            </code>
            <label className="mt-4 block text-sm font-semibold text-navy">Enter code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className={inputClass} />
            {errorBox}
            <div className="mt-4 flex items-center gap-3">
              <Button type="button" variant="accent" onClick={confirmTotp} disabled={busy || code.trim() === ""}>
                {busy ? "Confirming…" : "Confirm & enable"}
              </Button>
              <button type="button" onClick={reset} className="text-sm font-semibold text-body hover:text-navy">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Email setup ---
  if (mode === "setup-email") {
    return (
      <div>
        <h2 className="text-lg font-bold text-navy">Set up email codes</h2>
        <p className="mt-2 text-sm text-body">
          {emailSent ? "We sent a 6-digit code to your email. Enter it below to turn on two-factor." : "Sending a code…"}
        </p>
        <label className="mt-4 block text-sm font-semibold text-navy">Enter code</label>
        <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className={inputClass} />
        {errorBox}
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" variant="accent" onClick={confirmEmail} disabled={busy || code.trim() === ""}>
            {busy ? "Confirming…" : "Confirm & enable"}
          </Button>
          <button type="button" onClick={startEmail} disabled={busy} className="text-sm font-semibold text-navy hover:text-red">
            Resend code
          </button>
          <button type="button" onClick={reset} className="text-sm font-semibold text-body hover:text-navy">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // --- Idle: enabled ---
  if (enabled) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            On
          </span>
          <p className="text-sm text-body">
            Method: <span className="font-semibold text-navy">{method === "email" ? "Email codes" : "Authenticator app"}</span>
          </p>
        </div>
        {recoveryPanel}

        <div className="mt-6 space-y-4">
          {method === "totp" ? (
            <div className="rounded-xl border border-black/5 p-4">
              <p className="text-sm font-semibold text-navy">Recovery codes</p>
              <p className="mt-1 text-xs text-body">Generate a new set (this invalidates the old ones).</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Confirm password" className={`${inputClass} mt-0 max-w-xs`} />
                <Button type="button" variant="outline" onClick={regenerate} disabled={busy || password === ""}>
                  {busy ? "Working…" : "Regenerate codes"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-red/20 p-4">
            <p className="text-sm font-semibold text-navy">Turn off two-factor</p>
            <p className="mt-1 text-xs text-body">Your account will be less secure. Enter your password to confirm.</p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Confirm password" className={`${inputClass} mt-0 max-w-xs`} />
              <Button type="button" variant="accent" onClick={disable} disabled={busy || password === ""}>
                {busy ? "Working…" : "Turn off"}
              </Button>
            </div>
          </div>
          {errorBox}
        </div>
      </div>
    );
  }

  // --- Idle: disabled ---
  return (
    <div>
      <p className="text-sm text-body">
        Add a second step at login so your account stays safe even if your password is stolen.
      </p>
      {recoveryPanel}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/5 p-5">
          <p className="text-sm font-semibold text-navy">Authenticator app</p>
          <p className="mt-1 text-xs text-body">
            Use Google Authenticator, Authy or 1Password. Works offline. Includes recovery codes.
          </p>
          <Button type="button" variant="primary" className="mt-4" onClick={startTotp} disabled={busy}>
            {busy ? "Starting…" : "Set up"}
          </Button>
        </div>
        <div className="rounded-xl border border-black/5 p-5">
          <p className="text-sm font-semibold text-navy">Email codes</p>
          <p className="mt-1 text-xs text-body">
            We email a fresh code each time you log in. No app needed.
          </p>
          <Button type="button" variant="primary" className="mt-4" onClick={startEmail} disabled={busy}>
            {busy ? "Sending…" : "Set up"}
          </Button>
        </div>
      </div>
      {errorBox}
    </div>
  );
}
