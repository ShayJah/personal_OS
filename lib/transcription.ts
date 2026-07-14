import "server-only";

export class TranscriptionNotConfiguredError extends Error {
  constructor() {
    super("GROQ_API_KEY is not set — voice transcription is disabled.");
  }
}

export function isVoiceTranscriptionEnabled(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export async function transcribeAudio(
  audio: Blob,
  filename: string
): Promise<string> {
  if (!isVoiceTranscriptionEnabled()) {
    throw new TranscriptionNotConfiguredError();
  }

  const body = new FormData();
  body.append("file", audio, filename);
  body.append("model", "whisper-large-v3-turbo");
  body.append("response_format", "json");

  const res = await fetch(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body,
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Transcription failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
