/** @type {import('next').NextConfig} */
console.log(process.env.API_URL);
const nextConfig = {
    reactStrictMode: false,
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.API_URL}:path*`,
            },
        ];
    },
};

export default nextConfig;
