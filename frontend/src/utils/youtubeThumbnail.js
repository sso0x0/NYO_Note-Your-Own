// 강의 영상은 현재 유튜브 외부 링크(lectureUrl)만 저장한다.
// TODO: 추후 영상을 자체 저장 방식으로 바꾸면 이 유튜브 파싱 로직을 다시 확인해야 한다.
export function getYoutubeVideoId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, '');

    if (host === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }
    if (host === 'youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.slice('/embed/'.length) || null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.slice('/shorts/'.length) || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function getYoutubeThumbnailUrl(url) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

// 강의 썸네일 우선순위: 등록된 썸네일 > 유튜브 링크에서 뽑은 썸네일 > 없음(null.png는 호출부에서 처리)
export function resolveLectureThumbnail(lecture) {
  if (lecture?.thumbnailUrl) return lecture.thumbnailUrl;
  return getYoutubeThumbnailUrl(lecture?.lectureUrl);
}
