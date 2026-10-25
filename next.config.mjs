/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin Vercel serverless/edge functions to Sydney so that credit-related data
  // processed server-side stays in-region, matching the Supabase Sydney project.
  // (Set in vercel.json too; see README "Compliance".)
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
