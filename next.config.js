/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
}
module.exports = nextConfig
