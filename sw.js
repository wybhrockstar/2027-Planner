const CACHE_NAME = 'imgo-planner-v1';

// 오프라인에서도 열 수 있도록 캐시할 파일들
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 설치: 핵심 파일 미리 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// 활성화: 이전 버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: Network First (온라인이면 최신, 오프라인이면 캐시)
self.addEventListener('fetch', event => {
  // GitHub API 요청은 캐시 안 거침 (항상 네트워크 직접)
  if (event.request.url.includes('api.github.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공 응답이면 캐시에도 저장
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 오프라인이면 캐시에서
        return caches.match(event.request);
      })
  );
});
