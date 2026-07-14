"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createCaptureAction } from "./actions";

type SpeechRecognitionResultLike = {
  [index: number]: { [index: number]: { transcript: string } };
  length: number;
};

type SpeechRecognitionEventLike = { results: SpeechRecognitionResultLike };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function CaptureForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Feature detection is browser-only and would mismatch SSR if run during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoiceSupported(getSpeechRecognition() !== null);
  }, []);

  function toggleListening() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      typeof navigator !== "undefined" ? navigator.language : "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setType("voice");
      setContent(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        recognitionRef.current?.stop();
        setListening(false);
        setSaving(true);
        await createCaptureAction(formData);
        formRef.current?.reset();
        setContent("");
        setType("text");
        setSaving(false);
      }}
      className="space-y-2"
    >
      <textarea
        name="content"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setType("text");
        }}
        placeholder="Capture a thought, idea, or task..."
        required
        maxLength={5000}
        rows={3}
        className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
      />
      <input type="hidden" name="type" value={type} />

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving || !content.trim()}>
          {saving ? "Saving..." : "Capture"}
        </Button>
        {voiceSupported && (
          <Button
            type="button"
            variant="ghost"
            onClick={toggleListening}
            aria-pressed={listening}
            className={listening ? "text-danger" : undefined}
          >
            {listening ? "● Stop recording" : "🎙 Record"}
          </Button>
        )}
      </div>
    </form>
  );
}
