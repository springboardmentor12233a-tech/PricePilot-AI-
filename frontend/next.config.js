/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the frontend call "/api/..." and have Next.js silently forward it
  // to the FastAPI backend on port 8000. This avoids hardcoding
  // "http://localhost:8000" everywhere in frontend code and avoids CORS
  // issues in the browser during local dev.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
