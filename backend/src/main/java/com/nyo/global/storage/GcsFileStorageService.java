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
        try {
            String objectName = imageUrl.substring(imageUrl.indexOf("images/"));
            storage.delete(BlobId.of(bucket, objectName));
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.IMAGE_DELETE_FAILED);
        }
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