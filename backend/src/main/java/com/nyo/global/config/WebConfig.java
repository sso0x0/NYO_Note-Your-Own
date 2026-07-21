package com.nyo.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.PageableHandlerMethodArgumentResolverCustomizer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS는 여기서 다루지 않습니다. SecurityConfig가 /** 전체에 Security 레벨 CorsFilter를
 * 등록해서 먼저 가로채기 때문에, WebMvcConfigurer.addCorsMappings()로 여기서 따로 설정해도
 * 실제로는 적용되지 않습니다 (Spring Security + Spring MVC CORS 병행 시 흔한 함정).
 * CORS 허용 도메인을 바꿔야 하면 SecurityConfig의 CORS_ALLOWED_ORIGINS를 수정하세요.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 페이징 조회 시 허용하는 최대 size (전역 적용). 컨트롤러에서 경고 로그 등에 재사용할 때도 이 값을 참조할 것
    public static final int MAX_PAGE_SIZE = 50;

    // 클라이언트가 ?size=100000 처럼 과도한 값을 요청해도
    // maxPageSize를 넘으면 자동으로 이 값으로 잘라서 처리 (별도 예외 발생 X)
    @Bean
    public PageableHandlerMethodArgumentResolverCustomizer pageableCustomizer() {
        return resolver -> resolver.setMaxPageSize(MAX_PAGE_SIZE);
    }
}