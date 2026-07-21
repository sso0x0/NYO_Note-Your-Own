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

@Service
@RequiredArgsConstructor
public class GcsFileStorageService implements FileStorageService {

    private final Storage storage;

    @Value("${gcp.storage.bucket}")
    private String bucket;

    private static final List<String> ALLOWED_EXT = List.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

    private String extractObjectName(String imageUrl) {
        String decodedUrl = URLDecoder.decode(imageUrl, StandardCharsets.UTF_8);
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

    private String removeQueryString(String objectName) {
        int queryIndex = objectName.indexOf("?");
        return queryIndex >= 0 ? objectName.substring(0, queryIndex) : objectName;
    }

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

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            throw new BusinessException(ErrorCode.IMAGE_INVALID_EXTENSION);
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
