package com.nyo.global.config;

import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GcsConfig {

    @Bean
    public Storage storage() {
        return StorageOptions.newBuilder()
                .setProjectId("nyo-note-your-own")
                .build()
                .getService(); // ADC 자동으로 찾아서 인증
    }
}