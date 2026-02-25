/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const customDistDir = process.env.NEXT_DIST_DIR

const nextConfig = {
  ...(customDistDir ? { distDir: customDistDir } : {}),
  productionBrowserSourceMaps: true,
  experimental: {
    trustHostHeader: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['dev-imymemine.s3.ap-northeast-2.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'dev-imymemine.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'dev-imymemine.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'http',
        hostname: 'k.kakaocdn.net',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'imymemine1.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'http',
        hostname: 'dev.imymemine.kr',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'dev.imymemine.kr',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'http',
        hostname: 'img1.kakaocdn.net',
        pathname: '/**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'imymemine.kr',
        pathname: '/**',
        port: '',
      },
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
