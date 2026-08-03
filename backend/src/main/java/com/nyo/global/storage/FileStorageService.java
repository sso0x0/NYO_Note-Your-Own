package com.nyo.global.storage;

import org.springframework.web.multipart.MultipartFile;

// 이미지 등 파일 저장소 추상화. 현재 구현체는 GCS를 사용하는 GcsFileStorageService.
public interface FileStorageService {
    String store(MultipartFile file); // 파일을 저장하고 접근 가능한 URL을 반환
    void delete(String imageUrl); // URL로 저장된 파일을 삭제
}