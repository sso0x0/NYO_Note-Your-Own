package com.nyo.global.config;

import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// GCS(구글 클라우드 스토리지) 클라이언트 Bean을 등록하는 설정 클래스
@Configuration
public class GcsConfig {

    // GCS 클라이언트 Bean 등록 (이미지 업로드/삭제 시 GcsFileStorageService에서 주입받아 사용)
    @Bean
    public Storage storage() {
        return StorageOptions.newBuilder()
                .setProjectId("nyo-note-your-own")
                .build()
                .getService(); // ADC 자동으로 찾아서 인증
    }
}