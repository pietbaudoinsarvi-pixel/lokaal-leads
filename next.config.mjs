/** @type {import('next').NextConfig} */
const nextConfig = {
  // De sitemap leest de bestandsnamen in config/clients met fs.readdir;
  // dit zorgt dat die map ook in de Vercel-runtime aanwezig is.
  outputFileTracingIncludes: {
    "/sitemap.xml": ["./config/clients/**/*"],
  },
};

export default nextConfig;
