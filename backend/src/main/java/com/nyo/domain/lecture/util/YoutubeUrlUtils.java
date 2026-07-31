package com.nyo.domain.lecture.util;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

// 강의 영상은 현재 유튜브 외부 링크(lectureUrl)만 지원한다.
// 프론트 frontend/src/utils/youtubeThumbnail.js와 동일한 파싱 규칙을 유지해야 한다.
// TODO: 추후 다른 영상 플랫폼/자체 저장 방식을 지원하게 되면 이 파싱 로직을 다시 확인해야 한다.
public final class YoutubeUrlUtils {

    private YoutubeUrlUtils() {
    }

    // 유튜브 링크(watch/youtu.be/embed/shorts)에서 영상 ID를 추출. 유튜브 링크가 아니면 null.
    public static String extractVideoId(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        try {
            URI uri = new URI(url.trim());
            String host = uri.getHost();
            if (host == null) {
                return null;
            }
            host = host.replaceFirst("^www\\.|^m\\.", "");
            String path = uri.getPath() == null ? "" : uri.getPath();

            if ("youtu.be".equals(host)) {
                return path.length() > 1 ? path.substring(1) : null;
            }
            if ("youtube.com".equals(host)) {
                if ("/watch".equals(path)) {
                    return extractQueryParam(uri.getRawQuery(), "v");
                }
                if (path.startsWith("/embed/")) {
                    String id = path.substring("/embed/".length());
                    return id.isEmpty() ? null : id;
                }
                if (path.startsWith("/shorts/")) {
                    String id = path.substring("/shorts/".length());
                    return id.isEmpty() ? null : id;
                }
            }
            return null;
        } catch (URISyntaxException e) {
            return null;
        }
    }

    // 강의 URL에서 뽑아낸 유튜브 대표 썸네일 URL. 유튜브 링크가 아니면 null.
    public static String buildThumbnailUrl(String lectureUrl) {
        String videoId = extractVideoId(lectureUrl);
        // hqdefault(4:3, 검은 여백 패딩)보다 mqdefault(16:9)가 카드 썸네일에 더 잘 맞는다.
        return videoId == null ? null : "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg";
    }

    private static String extractQueryParam(String rawQuery, String key) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return null;
        }
        return Arrays.stream(rawQuery.split("&"))
                .map(pair -> pair.split("=", 2))
                .filter(kv -> kv.length == 2 && kv[0].equals(key))
                .map(kv -> URLDecoder.decode(kv[1], StandardCharsets.UTF_8))
                .findFirst()
                .orElse(null);
    }
}
