import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL?.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: ["/", "/archive", "/cases/"], disallow: ["/api/", "/play/", "/profile", "/admin", "/investigation/"] }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
