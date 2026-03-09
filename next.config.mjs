/** @type {import('next').NextConfig} */

const customDistDir = process.env.NEXT_DIST_DIR
const isAnalyze = process.env.ANALYZE === 'true'

/**
 * ANALYZE=true 일 때만 @next/bundle-analyzer를 동적으로 로드
 * (CI 서버에 패키지가 없어도 ANALYZE=false면 빌드가 안 터짐)
 */
const withBundleAnalyzer = isAnalyze
  ? (await import('@next/bundle-analyzer')).default({ enabled: true })
  : (config) => config

const nextConfig = {
  output: 'standalone',
  ...(customDistDir ? { distDir: customDistDir } : {}),
  productionBrowserSourceMaps: true,
  images: {
    dangerouslyAllowLocalIP: true,
    formats: ['image/avif', 'image/webp'],
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
      { protocol: 'https', hostname: 'k.kakaocdn.net', pathname: '/**' },
      { protocol: 'http', hostname: 'k.kakaocdn.net', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'imymemine1.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
      { protocol: 'http', hostname: 'dev.imymemine.kr', pathname: '/**' },
      { protocol: 'https', hostname: 'dev.imymemine.kr', pathname: '/**' },
      { protocol: 'http', hostname: 'img1.kakaocdn.net', pathname: '/**' },
      { protocol: 'https', hostname: 'imymemine.kr', pathname: '/**' },
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
