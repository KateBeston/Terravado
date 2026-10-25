import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

/* PWA manifest generated from the single brand config, so the install name,
   colours and icon all follow BRAND. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
