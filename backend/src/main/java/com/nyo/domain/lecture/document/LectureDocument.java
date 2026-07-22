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

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Text)
    private String description;

    @Field(type = FieldType.Text)
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
