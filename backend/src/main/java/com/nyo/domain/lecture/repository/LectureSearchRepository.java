package com.nyo.domain.lecture.repository;

import com.nyo.domain.lecture.document.LectureDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface LectureSearchRepository extends ElasticsearchRepository<LectureDocument, Long> {

    // 제목/강사명/설명에 대한 멀티매치 검색 (제목 가중치 3배, 강사명 2배).
    // 1) nori 형태소 단위 매치: 검색어의 모든 단어가 한 필드 안에 다 있어야 매치(operator=and)되어 정확도를 우선한다.
    // 2) 부분 문자열 매치(.ngram 필드): 형태소 경계와 무관한 짧은 검색어를 위한 보조 수단이라 boost를 낮춰 순위를 뒤로 민다.
    @Query("""
            {
              "bool": {
                "should": [
                  { "multi_match": { "query": "?0", "fields": ["title^3", "instructor^2", "description"], "operator": "and" } },
                  { "multi_match": { "query": "?0", "fields": ["title.ngram^3", "instructor.ngram^2", "description.ngram"], "operator": "and", "boost": 0.3 } }
                ]
              }
            }
            """)
    Page<LectureDocument> searchByKeyword(String keyword, Pageable pageable);
}
