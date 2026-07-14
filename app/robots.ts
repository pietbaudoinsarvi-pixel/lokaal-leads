import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// robots.txt. API-routes en operator-testpagina's zijn geen webpagina's en
// mogen niet gecrawld worden. Pagina's die WEL gecrawld maar NIET geindexeerd
// mogen worden (onboarding, print-kaarten, demo-sites) regelen dat zelf via
// een noindex-metatag: zo kan Google die tag ook echt lezen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/api/", "/lead-test", "/review-test"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
