/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If your repository is not at the root domain (e.g., username.github.io/repo-name/),
  // uncomment and set the following line:
  // basePath: '/ALAI',
};

export default nextConfig;
