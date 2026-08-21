import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/client", "/manager", "/api", "/login", "/forgot-password", "/reset-password", "/verify-email", "/unauthorized"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
