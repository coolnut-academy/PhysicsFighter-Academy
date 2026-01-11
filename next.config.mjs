/** @type {import('next').NextConfig} */
const nextConfig = {
          transpilePackages: ['undici', 'firebase', '@firebase/auth', '@firebase/storage', '@firebase/firestore', '@firebase/app'],
          images: {
                    remotePatterns: [
                              {
                                        protocol: 'https',
                                        hostname: 'firebasestorage.googleapis.com',
                              },
                              {
                                        protocol: 'https',
                                        hostname: 'lh3.googleusercontent.com',
                              }
                    ],
          },
};

export default nextConfig;
