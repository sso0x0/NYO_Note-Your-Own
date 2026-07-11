package com.nyo.domain.chat.entity;

/**
 * 챗봇 대화의 발신자 구분. chat_histories.sender_role CHECK 제약과 값이 일치해야 합니다.
 */
public enum SenderRole {
    USER,
    ASSISTANT
}
