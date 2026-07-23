FROM docker.elastic.co/elasticsearch/elasticsearch:8.17.4

# Nori Analyzer 플러그인 설치 (한글 형태소 분석)
RUN bin/elasticsearch-plugin install analysis-nori
