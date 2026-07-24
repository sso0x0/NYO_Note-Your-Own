package com.nyo.domain.post.repository;

import com.nyo.domain.post.document.PostDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface PostSearchRepository extends ElasticsearchRepository<PostDocument, Long> {

    // 제목/본문에 대한 멀티매치 검색 (제목 가중치 3배). 공지글은 애초에 색인되지 않는다.
    @Query("""
            {
              "multi_match": {
                "query": "?0",
                "fields": ["title^3", "content"]
              }
            }
            """)
    Page<PostDocument> searchByKeyword(String keyword, Pageable pageable);
}
