/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ["upcdn.io", "replicate.delivery", "lh3.googleusercontent.com", "2100bb7379b3adaba6ea0954af4263ce.r2.cloudflarestorage.com"],
  },
  async redirects() {
    return [
      {
        source: "/github",
        destination: "https://github.com/meteron-ai/react-roomgpt",
        permanent: false,
      },
      {
        source: "/deploy",
        destination: "https://vercel.com/templates/next.js/room-GPT",
        permanent: false,
      },
    ];
  },
};
