import type { MetadataRoute } from "next";

/**
 * PWA manifest (served at /manifest.webmanifest).
 * Icons are generated from the official crest — see public/brand/.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "University of Ghana · Student Portal",
    short_name: "UG Portal",
    description:
      "Student self-service portal: fees, timetable, results, complaints and more.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay"],
    orientation: "portrait-primary",
    background_color: "#f8f6f1",
    theme_color: "#200060",
    categories: ["education", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Dashboard", short_name: "Home", url: "/dashboard" },
      { name: "Pay fees", short_name: "Pay", url: "/pay" },
      { name: "Exam schedule", short_name: "Exams", url: "/exams" },
      { name: "Notifications", short_name: "Alerts", url: "/notifications" },
    ],
  };
}
