/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers applied to every response.
  // These are cheap, high-value protections required by docs/15-security.md.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stop the browser from guessing a file's type (blocks some XSS tricks).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't let other sites embed us in an iframe (blocks clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Don't leak our full URLs to other websites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Turn off browser features we never use.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
