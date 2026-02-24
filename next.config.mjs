/** @type {import('next').NextConfig} */
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  productionBrowserSourceMaps: true,
  experimental: {
    trustHostHeader: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'dev-imymemine.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dev-imymemine.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'k.kakaocdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imymemine1.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'dev.imymemine.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dev.imymemine.kr',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'img1.kakaocdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imymemine.kr',
        pathname: '/**',
      },
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
