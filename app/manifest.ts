import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amahoro",
    short_name: "Amahoro",
    description:
      "A calm, minimal operations system for priorities, projects, and business/CRM workflows.",
    id: "/",
    lang: "en",
    scope: "/",
    orientation: "portrait",
    categories: ["productivity", "business"],
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ebe3d3",
    theme_color: "#ebe3d3",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Home base", url: "/home" },
      { name: "Quick capture", url: "/capture" },
      { name: "Tasks", url: "/tasks" },
    ],
  };
}
