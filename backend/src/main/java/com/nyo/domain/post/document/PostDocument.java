package com.nyo.domain.post.document;

import com.nyo.domain.post.entity.Post;
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

// 커뮤니티 게시글 검색(Elasticsearch)용 문서. 공지글은 색인하지 않는다(PostServiceImpl에서 걸러짐).
// ngram-settings.json: 형태소 경계와 무관한 부분 일치 검색을 위한 partial_ngram 분석기 정의
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Document(indexName = "posts")
@Setting(settingPath = "elasticsearch/ngram-settings.json")
public class PostDocument {

    @Id
    private Long id;

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

    public static PostDocument from(Post post) {
        return PostDocument.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .build();
    }
}
