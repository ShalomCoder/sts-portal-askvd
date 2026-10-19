/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No remote images needed — profile photos come from the JSON APIs as URLs
  // we proxy; keep Next's image optimizer off for simplicity.
  images: { unoptimized: true },
};

export default nextConfig;
