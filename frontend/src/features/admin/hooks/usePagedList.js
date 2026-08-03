import { useEffect, useState } from 'react';

// 관리자 목록 화면(게시글/노트 등) 공통 페이지네이션 로직. fetcher는 { page, size }를 받아
// Page<T> 형태의 응답을 반환해야 한다.
export function usePagedList(fetcher, initialPage = 0) {
  // 신고 관리에서 특정 항목으로 이동할 때 해당 항목이 있는 페이지부터 조회할 수 있다.
  const [page, setPage] = useState(initialPage);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('loading');
    setError(null);

    fetcher({ page, size: 10 })
      .then((data) => {
        if (cancelled) return;
        setPageData(data);
        setStatus('success');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reloadKey]);

  // reloadKey를 증가시켜 useEffect를 다시 실행, 목록을 재조회한다.
  const reload = () => setReloadKey((k) => k + 1);

  return { page, setPage, pageData, status, error, reload };
}

export default usePagedList;
