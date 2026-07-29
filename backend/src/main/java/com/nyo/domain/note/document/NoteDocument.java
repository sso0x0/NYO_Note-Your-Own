package com.nyo.domain.note.document;

import com.nyo.domain.note.entity.Note;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.InnerField;
import org.springframework.data.elasticsearch.annotations.MultiField;
import org.springframework.data.elasticsearch.annotations.Setting;

import java.util.List;

// 노트 검색(Elasticsearch)용 문서. JPA Note 엔티티와 별개로 검색에 필요한 필드만 색인한다.
// ngram-settings.json: 형태소 경계와 무관한 부분 일치 검색을 위한 partial_ngram 분석기 정의
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Document(indexName = "notes")
@Setting(settingPath = "elasticsearch/ngram-settings.json")
public class NoteDocument {

    @Id
    private Long id;

    // 챗봇 RAG 검색에서 "본인 노트만(및 선택적으로 특정 강의로)" 범위를 좁히기 위한 필터 전용 필드.
    // 텍스트 분석 대상이 아니라 정확히 일치하는 값으로만 걸러야 하므로 Long 타입 그대로 색인한다.
    @Field(type = FieldType.Long)
    private Long userId;

    @Field(type = FieldType.Long)
    private Long lectureId;

    // 한글 형태소 분석을 위해 nori 분석기 사용 (Elasticsearch 컨테이너에 analysis-nori 플러그인 설치 필요)
    // .ngram 서브필드는 형태소 단위가 아닌 부분 문자열 일치 검색용
    @MultiField(
            mainField = @Field(type = FieldType.Text, analyzer = "nori"),
            otherFields = @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "partial_ngram", searchAnalyzer = "partial_ngram_search")
    )
    private String title;

    @MultiField(
            mainField = @Field(type = FieldType.Text, analyzer = "nori"),
            otherFields = @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "partial_ngram", searchAnalyzer = "partial_ngram_search")
    )
    private String content;

    // AI 자동 태깅으로 붙은 태그명. 태그가 아직 없는 노트는 빈 리스트로 색인된다.
    @MultiField(
            mainField = @Field(type = FieldType.Text, analyzer = "nori"),
            otherFields = @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "partial_ngram", searchAnalyzer = "partial_ngram_search")
    )
    private List<String> tags;

    // 작성자 닉네임도 노트 검색어로 사용할 수 있도록 검색 문서에 함께 저장한다.
    @MultiField(
            mainField = @Field(type = FieldType.Text, analyzer = "nori"),
            otherFields = @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "partial_ngram", searchAnalyzer = "partial_ngram_search")
    )
    private String authorNickname;

    public static NoteDocument from(Note note, List<String> tagNames, String authorNickname) {
        return NoteDocument.builder()
                .id(note.getId())
                .userId(note.getUserId())
                .lectureId(note.getLectureId())
                .title(note.getTitle())
                .content(note.getContent())
                .tags(tagNames)
                .authorNickname(authorNickname)
                .build();
    }
}
