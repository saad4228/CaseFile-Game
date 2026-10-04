import type { MetadataRoute } from "next";
import { cases } from "@/data/cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/archive`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/rooms/new`, changeFrequency: "monthly", priority: 0.5 },
    ...cases.filter((c) => c.playable).map((c) => ({ url: `${base}/cases/${c.id}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
