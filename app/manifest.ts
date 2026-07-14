import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PersonalOS",
    short_name: "PersonalOS",
    description:
      "A calm, minimal personal operating system for priorities, tasks, and habits.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6ece1",
    theme_color: "#f6ece1",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
