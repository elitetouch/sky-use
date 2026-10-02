"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VerifiedBadge } from "./VerifiedBadge";

/**
 * Customer identity check: NIN + a live selfie. The photo is captured straight
 * from the camera (never uploaded from disk) and sent to the API, which matches
 * it against the NIN's photo via Prembly. On success the Verified badge shows.
 */
export function NinFaceVerify({
  verified: initialVerified = false,
  refreshOnVerify = false,
  onVerified,
}: {
  verified?: boolean;
  refreshOnVerify?: boolean;
  onVerified?: (name: string) => void;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [verified, setVerified] = useState(initialVerified);
  const [nin, setNin] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setError(null);
    setImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      // Attach after the <video> is rendered.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError("We couldn't access your camera. Please allow camera access and try again.");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  }

  function retake() {
    setImage(null);
    void startCamera();
  }

  async function verify() {
    setError(null);
    const value = nin.trim();
    if (!/^\d{11}$/.test(value)) {
      setError("Enter your 11-digit NIN.");
      return;
    }
    if (!image) {
      setError("Take a live photo to continue.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/identity/nin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin: value, image }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "We couldn't verify your identity.");
        return;
      }
      setVerified(true);
      onVerified?.(json.data?.name ?? "");
      if (refreshOnVerify) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return <VerifiedBadge />;
  }

  return (
    <div className="max-w-sm">
      <label className="block text-sm font-medium text-navy">Your NIN</label>
      <input
        value={nin}
        onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
        inputMode="numeric"
        placeholder="Enter 11-digit NIN"
        className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />

      <div className="mt-3">
        <p className="text-sm font-medium text-navy">Live photo</p>
        <div className="mt-1 overflow-hidden rounded-xl border border-black/10 bg-black/[0.03]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Your captured selfie" className="aspect-square w-full object-cover" />
          ) : cameraOn ? (
            <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center p-4 text-center text-sm text-body">
              Take a quick selfie to confirm it&apos;s you.
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {!cameraOn && !image ? (
            <button type="button" onClick={startCamera} className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-navy hover:border-navy">
              Start camera
            </button>
          ) : null}
          {cameraOn ? (
            <button type="button" onClick={capture} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              Capture
            </button>
          ) : null}
          {image ? (
            <button type="button" onClick={retake} className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-navy hover:border-navy">
              Retake
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-red">{error}</p> : null}

      <button
        type="button"
        onClick={verify}
        disabled={busy || nin.trim().length !== 11 || !image}
        className="mt-3 w-full rounded-lg bg-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-light disabled:opacity-50"
      >
        {busy ? "Verifying…" : "Verify identity"}
      </button>
    </div>
  );
}
