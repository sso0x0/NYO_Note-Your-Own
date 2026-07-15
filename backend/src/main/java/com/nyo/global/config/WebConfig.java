package com.nyo.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.PageableHandlerMethodArgumentResolverCustomizer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 페이징 조회 시 허용하는 최대 size (전역 적용). 컨트롤러에서 경고 로그 등에 재사용할 때도 이 값을 참조할 것
    public static final int MAX_PAGE_SIZE = 50;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Vite 개발 서버 기본 포트
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    // 클라이언트가 ?size=100000 처럼 과도한 값을 요청해도
    // maxPageSize를 넘으면 자동으로 이 값으로 잘라서 처리 (별도 예외 발생 X)
    @Bean
    public PageableHandlerMethodArgumentResolverCustomizer pageableCustomizer() {
        return resolver -> resolver.setMaxPageSize(MAX_PAGE_SIZE);
    }
}