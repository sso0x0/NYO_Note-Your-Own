package com.nyo.domain.note.repository;

import com.nyo.domain.note.document.NoteDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface NoteSearchRepository extends ElasticsearchRepository<NoteDocument, Long> {

    // 제목/태그/본문에 대한 멀티매치 검색 (제목 가중치 3배, 태그 2배)
    @Query("""
            {
              "multi_match": {
                "query": "?0",
                "fields": ["title^3", "tags^2", "content"]
              }
            }
            """)
    Page<NoteDocument> searchByKeyword(String keyword, Pageable pageable);
}
