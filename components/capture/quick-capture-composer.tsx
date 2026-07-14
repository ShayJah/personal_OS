"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createCaptureAction } from "@/app/(app)/capture/actions";

type Phase = "idle" | "recording" | "transcribing";

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export function QuickCaptureComposer({
  autoFocus = false,
  onDone,
}: {
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [content, setContent] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [micSupported, setMicSupported] = useState(false);

  useEffect(() => {
    // Feature detection is browser-only and would mismatch SSR if run during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMicSupported(
      typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    setSeconds(0);
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size === 0) {
          setPhase("idle");
          return;
        }

        setPhase("transcribing");
        try {
          const body = new FormData();
          const ext = blob.type.includes("mp4") ? "mp4" : "webm";
          body.append("audio", blob, `capture.${ext}`);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Transcription failed");

          const text = (data.text as string) ?? "";
          if (!text.trim()) {
            setError("Didn't catch that — try again.");
          } else {
            setContent((prev) => (prev ? `${prev} ${text}` : text));
            setType("voice");
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Transcription failed"
          );
        } finally {
          setPhase("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
    } catch {
      setError("Couldn't access the microphone. Check permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  const isBusy = phase !== "idle" || saving;

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setSaving(true);
        await createCaptureAction(formData);
        formRef.current?.reset();
        setContent("");
        setType("text");
        setSaving(false);
        onDone?.();
      }}
      className="space-y-2"
    >
      <textarea
        ref={textareaRef}
        name="content"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setType("text");
        }}
        autoFocus={autoFocus}
        placeholder="Capture a thought, idea, or task..."
        required
        maxLength={5000}
        rows={3}
        className="w-full resize-none px-3 py-2 text-sm"
      />
      <input type="hidden" name="type" value={type} />

      {phase === "recording" && (
        <p className="flex items-center gap-2 text-xs text-danger">
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
          Recording… {seconds}s
        </p>
      )}
      {phase === "transcribing" && (
        <p className="text-xs text-muted">Transcribing…</p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isBusy || !content.trim()}>
          {saving ? "Adding..." : "Add"}
        </Button>
        {micSupported && (
          <Button
            type="button"
            variant="ghost"
            disabled={phase === "transcribing" || saving}
            onClick={phase === "recording" ? stopRecording : startRecording}
            aria-pressed={phase === "recording"}
            className={phase === "recording" ? "text-danger" : undefined}
          >
            {phase === "recording" ? "Stop" : "🎙 Voice"}
          </Button>
        )}
      </div>
    </form>
  );
}
