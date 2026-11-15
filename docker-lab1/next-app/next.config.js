/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a small self-contained server in .next/standalone
  output: 'standalone',
  // App lives under /next behind the Nginx reverse proxy.
  basePath: '/next',
}

module.exports = nextConfig
