package com.nyo.global.moderation;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

/**
 * DB를 사용하지 않는 간단한 금지어 검사기입니다.
 * 관리자에게 표시할 단어를 바꾸려면 PROHIBITED_WORDS 목록만 수정하면 됩니다.
 */
@Component
public class ProhibitedWordFilter {

    // 금지어 수정 위치: 아래 목록에 단어를 추가하거나 삭제합니다.
    private static final List<String> PROHIBITED_WORDS = List.of(
            "시발", "씨발", "병신", "개새끼",
            "꺼져", "죽어", "미친놈", "미친년", "ㅅㅂ"
    );

    public List<String> findMatchedWords(String title, String content) {
        String source = (String.valueOf(title) + " " + String.valueOf(content))
                .toLowerCase(Locale.ROOT);
        return PROHIBITED_WORDS.stream()
                .filter(word -> source.contains(word.toLowerCase(Locale.ROOT)))
                .toList();
    }
}
