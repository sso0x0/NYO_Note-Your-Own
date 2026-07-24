package com.nyo.domain.lecture.document;

import com.nyo.domain.lecture.entity.Lecture;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

// 강의 검색(Elasticsearch)용 문서. JPA Lecture 엔티티와 별개로 검색에 필요한 필드만 색인한다.
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Document(indexName = "lectures")
public class LectureDocument {

    @Id
    private Long id;

    // 한글 형태소 분석을 위해 nori 분석기 사용 (Elasticsearch 컨테이너에 analysis-nori 플러그인 설치 필요)
    @Field(type = FieldType.Text, analyzer = "nori")
    private String title;

    @Field(type = FieldType.Text, analyzer = "nori")
    private String description;

    @Field(type = FieldType.Text, analyzer = "nori")
    private String instructor;

    @Field(type = FieldType.Long)
    private Long categoryId;

    public static LectureDocument from(Lecture lecture) {
        return LectureDocument.builder()
                .id(lecture.getId())
                .title(lecture.getTitle())
                .description(lecture.getDescription())
                .instructor(lecture.getInstructor())
                .categoryId(lecture.getCategory().getId())
                .build();
    }
}
