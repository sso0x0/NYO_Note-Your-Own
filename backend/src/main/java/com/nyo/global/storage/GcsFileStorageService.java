package com.nyo.global.storage;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.nyo.global.exception.BusinessException;
import com.nyo.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

// FileStorageService의 GCS(Google Cloud Storage) 구현체
@Service
@RequiredArgsConstructor
public class GcsFileStorageService implements FileStorageService {

    private final Storage storage;

    @Value("${gcp.storage.bucket}")
    private String bucket;

    // 강사 신청 첨부(이력서 등)도 같은 업로드 엔드포인트를 쓰므로 pdf도 허용한다.
    private static final List<String> ALLOWED_EXT = List.of("jpg", "jpeg", "png", "gif", "webp", "pdf");
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB

    // 확장자/용량 검증 후 GCS 버킷에 업로드하고 공개 접근 URL을 반환한다
    @Override
    public String store(MultipartFile file) {
        validate(file);

        String ext = getExtension(file.getOriginalFilename());
        String objectName = "images/" + UUID.randomUUID() + "." + ext;

        BlobId blobId = BlobId.of(bucket, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(file.getContentType())
                .build();

        try {
            storage.create(blobInfo, file.getBytes());
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }

        return String.format("https://storage.googleapis.com/%s/%s", bucket, objectName);
    }

    // URL에서 GCS 객체명을 뽑아 실제 버킷에서 삭제한다
    @Override
    public void delete(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        try {
            String objectName = extractObjectName(imageUrl);
            if (objectName == null) {
                return;
            }

            // GCS에서 실제 삭제가 실패하면 조용히 넘어가지 않고 이미지 삭제 실패로 처리한다.
            boolean deleted = storage.delete(BlobId.of(bucket, objectName));
            if (!deleted) {
                throw new BusinessException(ErrorCode.IMAGE_DELETE_FAILED);
            }
        } catch (Exception e) {
            if (e instanceof BusinessException) {
                throw e;
            }
            throw new BusinessException(ErrorCode.IMAGE_DELETE_FAILED);
        }
    }

    // 다양한 형태의 GCS URL(경로형/버킷 서브도메인형/객체명만 있는 경우)에서 객체명만 뽑아낸다
    private String extractObjectName(String imageUrl) {
        String decodedUrl = URLDecoder.decode(imageUrl, StandardCharsets.UTF_8);
        // 과거에 저장된 URL fragment가 있어도 실제 GCS 객체명만 추출합니다.
        int fragmentIndex = decodedUrl.indexOf('#');
        if (fragmentIndex >= 0) {
            decodedUrl = decodedUrl.substring(0, fragmentIndex);
        }
        String bucketPathPrefix = "storage.googleapis.com/" + bucket + "/";
        int bucketPathIndex = decodedUrl.indexOf(bucketPathPrefix);

        if (bucketPathIndex >= 0) {
            return removeQueryString(decodedUrl.substring(bucketPathIndex + bucketPathPrefix.length()));
        }

        String hostedBucketPrefix = bucket + ".storage.googleapis.com/";
        int hostedBucketIndex = decodedUrl.indexOf(hostedBucketPrefix);

        if (hostedBucketIndex >= 0) {
            return removeQueryString(decodedUrl.substring(hostedBucketIndex + hostedBucketPrefix.length()));
        }

        if (decodedUrl.startsWith("images/")) {
            return removeQueryString(decodedUrl);
        }

        return null;
    }

    // 객체명 뒤에 붙은 쿼리스트링(?...)이 있으면 제거한다
    private String removeQueryString(String objectName) {
        int queryIndex = objectName.indexOf("?");
        return queryIndex >= 0 ? objectName.substring(0, queryIndex) : objectName;
    }

    // 빈 파일 / 허용되지 않는 확장자 / 최대 용량 초과 여부를 검사한다
    private void validate(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.IMAGE_EMPTY);
        }
        String ext = getExtension(file.getOriginalFilename()).toLowerCase();
        if (!ALLOWED_EXT.contains(ext)) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BusinessException(ErrorCode.IMAGE_TOO_LARGE);
        }
    }

    // 파일명에서 확장자를 추출하고, 확장자가 없으면 예외를 던진다
    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
