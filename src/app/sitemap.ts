import type { MetadataRoute } from "next";
import { siteUrl } from "./site-metadata";

const staticRoutes = ["", "/new", "/legal", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date("2026-07-30"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
