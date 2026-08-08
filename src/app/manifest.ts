import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SkyFots Global Logistics",
    short_name: "SkyFots",
    description:
      "Book shipments, track packages and manage operations with SkyFots Global Logistics.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b1533",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-v2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
