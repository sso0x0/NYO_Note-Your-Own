package com.nyo.global.storage;

import com.nyo.domain.common.dto.response.ImageUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageUploadResponse upload(@RequestParam("file") MultipartFile file) {
        String imageUrl = fileStorageService.store(file);

        // GCS URL과 함께 원본 파일명/파일 크기를 프론트로 돌려줘 DB 저장 요청에 같이 사용한다.
        return ImageUploadResponse.builder()
                .imageUrl(imageUrl)
                .originalName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .build();
    }
}
