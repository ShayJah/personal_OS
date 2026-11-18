"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { photoToSquareDataUrl } from "@/lib/image-resize";
import { BusinessAvatar } from "../business-avatar";
import { updateBusinessIconAction } from "./actions";

const ICONS = [
  "💼", "🚀", "🌱", "🍷", "📚", "🎓", "🏡", "🧠",
  "🤖", "📈", "💡", "🛠️", "🎯", "🔭", "✨", "🌍",
  "🏔️", "🍁", "☕", "🎨", "📣", "🧪", "🏥", "⚡",
  "🔥", "🌊", "🦉", "🐝", "📱", "🛒", "🚲", "🎬",
];

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const buttonBase =
  "inline-flex min-h-10 shrink-0 cursor-pointer items-center rounded-xl px-3.5 text-sm transition active:scale-[0.98] aria-disabled:opacity-40 disabled:opacity-40";
const primaryButton = `${buttonBase} bg-foreground font-medium text-background hover:bg-foreground/85`;
const secondaryButton = `${buttonBase} border border-border-strong bg-surface hover:bg-foreground/5`;

export function IconPicker({
  businessId,
  name,
  color,
  icon,
  image,
}: {
  businessId: string;
  name: string;
  color: string;
  icon: string | null;
  image: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentIcon, setCurrentIcon] = useState(icon);
  const [currentImage, setCurrentImage] = useState(image);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const disabled = pending || busy;

  function save(change: { icon?: string | null; image?: string | null }) {
    startTransition(() => updateBusinessIconAction(businessId, change));
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That photo is over 15 MB. Pick a smaller one.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await photoToSquareDataUrl(file);
      setCurrentImage(dataUrl);
      save({ image: dataUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't use that photo.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = ""; // allow re-picking the same file
    }
  }

  function chooseEmoji(emoji: string) {
    setError(null);
    setCurrentIcon(emoji);
    setCurrentImage(null); // picking an emoji means "use this instead of the photo"
    save({ icon: emoji, image: null });
  }

  function useLetter() {
    setError(null);
    setCurrentIcon(null);
    setCurrentImage(null);
    save({ icon: null, image: null });
  }

  const hasCustom = Boolean(currentIcon || currentImage);

  return (
    <section
      aria-label="Icon"
      className="space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(33,24,16,0.04)] sm:p-6"
    >
      <div className="flex items-center gap-4">
        <BusinessAvatar name={name} color={color} icon={currentIcon} image={currentImage} className="h-16 w-16 text-4xl" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Icon</p>
          <p className="mt-1 text-sm text-muted">
            Shown on this business&apos;s card and page. Upload a photo or logo, or pick an emoji.
            {!hasCustom && " Until then it uses the first letter."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label aria-disabled={disabled} className={primaryButton}>
          {busy ? "Processing…" : currentImage ? "Replace photo" : "Upload photo"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={(e) => onFile(e.target.files?.[0])}
            className="sr-only"
          />
        </label>
        {currentImage && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setCurrentImage(null);
              save({ image: null });
            }}
            className={secondaryButton}
          >
            Remove photo
          </button>
        )}
        {hasCustom && (
          <button type="button" disabled={disabled} onClick={useLetter} className={secondaryButton}>
            Use letter
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div>
        <p className="mb-2 text-xs text-muted">Or pick an emoji</p>
        <div role="radiogroup" aria-label="Choose an emoji" className="grid grid-cols-8 gap-1.5">
          {ICONS.map((emoji) => {
            const selected = !currentImage && currentIcon === emoji;
            return (
              <button
                key={emoji}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={emoji}
                disabled={disabled}
                onClick={() => chooseEmoji(emoji)}
                className={cn(
                  "grid aspect-square min-h-11 place-content-center rounded-xl text-xl transition active:scale-95",
                  selected ? "bg-surface-sunken ring-2 ring-foreground" : "hover:bg-surface-sunken/70"
                )}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = custom.trim();
          if (value) {
            chooseEmoji(value);
            setCustom("");
          }
        }}
        className="flex gap-2"
      >
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          maxLength={16}
          placeholder="Or paste any emoji"
          aria-label="Custom emoji"
          className="min-h-11 min-w-0 flex-1 px-3.5 text-base sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled || !custom.trim()}
          className="min-h-11 shrink-0 rounded-xl bg-foreground px-4 text-sm font-medium text-background disabled:opacity-30"
        >
          Use
        </button>
      </form>
    </section>
  );
}
