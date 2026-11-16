"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Slide = { eyebrow: string; title: string; body: string };

const SLIDE_MS = 12_000;
const REFRESH_MS = 10 * 60_000;

export function TvSlides({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);

  useEffect(() => {
    const rotate = setInterval(() => setI((n) => n + 1), SLIDE_MS);
    const refresh = setInterval(() => router.refresh(), REFRESH_MS);
    return () => {
      clearInterval(rotate);
      clearInterval(refresh);
    };
  }, [router]);

  const s = slides[i % slides.length];
  return (
    <main className="fixed inset-0 flex flex-col justify-center gap-6 bg-[#3b2418] px-[8vw] text-[#ebe3d3]">
      <p className="text-[2.2vw] font-semibold uppercase tracking-[0.25em] text-[#b9814a]">{s.eyebrow}</p>
      <h1 className="font-serif text-[9vw] font-extrabold uppercase leading-none">{s.title}</h1>
      <p className="max-w-[80vw] text-[3vw] leading-snug">{s.body}</p>
    </main>
  );
}
