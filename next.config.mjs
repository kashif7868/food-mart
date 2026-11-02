/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /* Food photos come from the FoodMart backend (local uploads or Cloudinary). */
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
