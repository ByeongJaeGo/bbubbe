/**
 * 사이트 URL — sitemap, canonical, 네이버 SEO 점검에 사용
 */
const SITE_URL = 'https://bbubbe.vercel.app';

/**
 * 네이버 서치어드바이저 HTML meta 소유 확인 코드
 * 1) https://searchadvisor.naver.com/ → 웹마스터 도구 → 사이트 등록
 * 2) npm run naver:verify -- 발급코드
 * 3) 배포 후 서치어드바이저에서 [소유 확인] → 사이트맵·URL 수집 요청
 */
const NAVER_SITE_VERIFICATION = '5cdedf56c72bd28027f0a01e66378ddd2da345df';
