/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The shared workspace packages ship TypeScript source; Next transpiles them.
  transpilePackages: ["@terravado/engine", "@terravado/domain"],
};
export default nextConfig;
