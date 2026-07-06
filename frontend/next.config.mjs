const nextConfig = {
    async rewrites() {
        return [
            {
                source: "/backend/:path*",
                destination:
                    `${process.env.BACKEND_API_URL || "http://localhost:8000/api"}/:path*`,
            },
        ];
    },
};

export default nextConfig;
