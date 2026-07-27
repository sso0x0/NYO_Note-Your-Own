package com.nyo.domain.note.repository;

import com.nyo.domain.note.document.NoteDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface NoteSearchRepository extends ElasticsearchRepository<NoteDocument, Long> {

    // 제목/태그/본문에 대한 멀티매치 검색 (제목 가중치 3배, 태그 2배).
    // 1) nori 형태소 단위 매치: 검색어의 모든 단어가 한 필드 안에 다 있어야 매치(operator=and)되어 정확도를 우선한다.
    // 2) 부분 문자열 매치(.ngram 필드): 형태소 경계와 무관한 짧은 검색어를 위한 보조 수단이라 boost를 낮춰 순위를 뒤로 민다.
    // 영문 제목·태그·본문을 첫 글자나 일부 접두어만 입력해도 찾을 수 있도록 bool_prefix 검색을 함께 적용한다.
    @Query("""
            {
              "bool": {
                "should": [
                  { "multi_match": { "query": "?0", "fields": ["title^3", "authorNickname^2", "tags^2", "content"], "operator": "and" } },
                  { "multi_match": { "query": "?0", "fields": ["title^3", "authorNickname^2", "tags^2", "content"], "type": "bool_prefix", "boost": 0.8 } },
                  { "multi_match": { "query": "?0", "fields": ["title.ngram^3", "authorNickname.ngram^2", "tags.ngram^2", "content.ngram"], "operator": "and", "boost": 0.3 } }
                ]
              }
            }
            """)
    Page<NoteDocument> searchByKeyword(String keyword, Pageable pageable);

    @Query(""" 
            { "multi_match": { "query": "?0", "fields": ["title^3"], "type": "bool_prefix" } }
            """)
    Page<NoteDocument> searchByTitle(String keyword, Pageable pageable);

    @Query("""
            { "multi_match": { "query": "?0", "fields": ["content"], "type": "bool_prefix" } }
            """)
    Page<NoteDocument> searchByContent(String keyword, Pageable pageable);

    @Query("""
            { "multi_match": { "query": "?0", "fields": ["authorNickname^2"], "type": "bool_prefix" } }
            """)
    Page<NoteDocument> searchByAuthor(String keyword, Pageable pageable);
}
