package com.nyo.domain.lecture.repository;

import com.nyo.domain.lecture.document.LectureDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface LectureSearchRepository extends ElasticsearchRepository<LectureDocument, Long> {

    // 제목/강사명/설명에 대한 멀티매치 검색 (제목 가중치 3배, 강사명 2배)
    @Query("""
            {
              "multi_match": {
                "query": "?0",
                "fields": ["title^3", "instructor^2", "description"]
              }
            }
            """)
    Page<LectureDocument> searchByKeyword(String keyword, Pageable pageable);
}
