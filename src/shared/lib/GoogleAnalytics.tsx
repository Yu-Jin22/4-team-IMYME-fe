import Script from 'next/script'

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      {/* 앱 인터랙션 이후에 gtag 라이브러리를 로드해 초기 렌더 경로 영향 최소화 */}
      <Script
        id="google-analytics-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      {/* dataLayer/gtag를 초기화하고 현재 페이지 기준 GA 설정을 등록 */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());

		gtag('config', '${gaId}');
		`,
        }}
      />
    </>
  )
}
