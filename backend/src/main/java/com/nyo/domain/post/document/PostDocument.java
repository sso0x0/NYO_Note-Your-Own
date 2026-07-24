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

// 커뮤니티 게시글 검색(Elasticsearch)용 문서. 공지글은 색인하지 않는다(PostServiceImpl에서 걸러짐).
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Document(indexName = "posts")
public class PostDocument {

    @Id
    private Long id;

    // 한글 형태소 분석을 위해 nori 분석기 사용 (Elasticsearch 컨테이너에 analysis-nori 플러그인 설치 필요)
    @Field(type = FieldType.Text, analyzer = "nori")
    private String title;

    @Field(type = FieldType.Text, analyzer = "nori")
    private String content;

    public static PostDocument from(Post post) {
        return PostDocument.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .build();
    }
}
