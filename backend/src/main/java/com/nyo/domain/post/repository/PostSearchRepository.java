package com.nyo.domain.post.repository;

import com.nyo.domain.post.document.PostDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface PostSearchRepository extends ElasticsearchRepository<PostDocument, Long> {

    // 제목/본문에 대한 멀티매치 검색 (제목 가중치 3배). 공지글은 애초에 색인되지 않는다.
    // 1) nori 형태소 단위 매치: 검색어의 모든 단어가 한 필드 안에 다 있어야 매치(operator=and)되어 정확도를 우선한다.
    // 2) 부분 문자열 매치(.ngram 필드): 형태소 경계와 무관한 짧은 검색어를 위한 보조 수단이라 boost를 낮춰 순위를 뒤로 민다.
    @Query("""
            {
              "bool": {
                "should": [
                  { "multi_match": { "query": "?0", "fields": ["title^3", "content"], "operator": "and" } },
                  { "multi_match": { "query": "?0", "fields": ["title.ngram^3", "content.ngram"], "operator": "and", "boost": 0.3 } }
                ]
              }
            }
            """)
    Page<PostDocument> searchByKeyword(String keyword, Pageable pageable);
}
