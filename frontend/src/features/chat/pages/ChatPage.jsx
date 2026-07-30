import { useMemo, useState, useEffect } from 'react';
import { sendMessage, getHistories, deleteHistories, deleteAllHistories } from '../api/chat';
import ChatMessage, { SmileIcon } from '../ChatMessage';
import ChatInput from '../ChatInput';
import '../chat.css';
import './ChatPage.css';

const CHAT_HISTORY_SIZE = 10; // 지난 대화 기록 한 페이지당 개수

// 강의 시청/노트 상세 페이지의 학습 챗봇은 그 강의·노트로 컨텍스트가 좁혀지지만,
// 이 페이지는 lectureId/noteId를 아예 넘기지 않아 사용자가 지금까지 쓴 모든 노트를
// 대상으로 검색한다 (ChatService.buildNoteContext가 lectureId===null이면
// 전체 노트에서 찾도록 이미 되어 있음 — 백엔드 변경 없이 그대로 재사용).
//
// "새 대화 작성칸"과 "지난 대화 기록"을 따로 두지 않고 하나로 합쳤다: 질문을 보내면
// 그 자리에서 목록 맨 위에 새 항목으로 얹히고 바로 선택되는 식이라, 방금 물어본 것도
// 지난 기록 목록의 맨 위 칸일 뿐이다. 검색창은 지금까지 불러온 목록 안에서만 필터링한다
// (서버에 전체 검색 API가 없어 이미 불러온 페이지 범위로 한정).
export default function ChatPage() {
    const [chatHistories, setChatHistories] = useState([]);
    const [chatHistoryPage, setChatHistoryPage] = useState(0);
    const [chatHistoryHasMore, setChatHistoryHasMore] = useState(false);
    const [chatHistoryLoading, setChatHistoryLoading] = useState(true);
    const [chatHistoryLoadingMore, setChatHistoryLoadingMore] = useState(false);
    const [chatHistoryError, setChatHistoryError] = useState(null);

    const [selectedChatId, setSelectedChatId] = useState(null); // null = "새 대화" 화면
    const [selectedChatPairIds, setSelectedChatPairIds] = useState([]); // 삭제용 다중 선택
    const [chatHistoryDeleting, setChatHistoryDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(null);

    // chatHistories는 id 내림차순(최신순)으로 온다. 답변은 항상 질문 바로 다음에 저장되므로
    // id가 더 크고, 내림차순 목록에서는 질문 바로 앞자리에 온다 — 그 관계로 짝을 짓는다.
    const chatPairs = useMemo(() => {
        const pairs = [];
        chatHistories.forEach((entry, index) => {
            if (entry.senderRole !== 'USER') return;
            const prev = chatHistories[index - 1];
            const answer = prev && prev.senderRole === 'ASSISTANT' ? prev : null;
            pairs.push({ question: entry, answer });
        });
        return pairs;
    }, [chatHistories]);

    const filteredChatPairs = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();
        if (!keyword) return chatPairs;
        return chatPairs.filter((pair) => pair.question.message.toLowerCase().includes(keyword));
    }, [chatPairs, searchQuery]);

    const selectedChatPair = useMemo(
        () => chatPairs.find((pair) => pair.question.id === selectedChatId) ?? null,
        [chatPairs, selectedChatId]
    );

    useEffect(() => {
        let cancelled = false;
        getHistories({ size: CHAT_HISTORY_SIZE })
            .then((page) => {
                if (cancelled) return;
                setChatHistories(page?.content ?? []);
                setChatHistoryHasMore(!(page?.last ?? true));
            })
            .catch((err) => {
                if (!cancelled) setChatHistoryError(err.message);
            })
            .finally(() => {
                if (!cancelled) setChatHistoryLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSend = async (message) => {
        setSendError(null);
        setSending(true);
        // 낙관적으로 새 질문을 목록 맨 위에 얹고 바로 선택한다 — "새 대화 작성"과 "지난 기록"이
        // 하나의 목록/화면으로 보이게 하는 핵심 트릭이다.
        const pendingId = `pending-${Date.now()}`;
        setChatHistories((prev) => [
            { id: pendingId, senderRole: 'USER', message, createdAt: new Date().toISOString() },
            ...prev,
        ]);
        setSelectedChatId(pendingId);

        try {
            const answer = await sendMessage({ message });
            setChatHistories((prev) => [answer, ...prev]);
        } catch (err) {
            setSendError(err.message);
        } finally {
            setSending(false);
        }
    };

    const handleNewChat = () => {
        setSelectedChatId(null);
        setSendError(null);
    };

    const toggleChatPairSelected = (questionId) => {
        setSelectedChatPairIds((prev) =>
            prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
        );
    };

    const toggleAllChatPairsSelected = () => {
        const visibleIds = filteredChatPairs.map((pair) => pair.question.id);
        setSelectedChatPairIds((prev) =>
            visibleIds.every((id) => prev.includes(id)) ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))
        );
    };

    // 현재 불러온 목록에서 삭제된 id를 걷어내고, 선택 목록에서도 같이 지운다.
    const removeChatHistoryEntries = (deletedIds) => {
        const deletedSet = new Set(deletedIds);
        setChatHistories((prev) => prev.filter((entry) => !deletedSet.has(entry.id)));
        setSelectedChatPairIds((prev) => prev.filter((id) => !deletedSet.has(id)));
        if (deletedSet.has(selectedChatId)) setSelectedChatId(null);
    };

    const handleDeleteSelectedChatHistory = async () => {
        if (selectedChatPairIds.length === 0) return;
        if (!window.confirm(`선택한 ${selectedChatPairIds.length}개 질문(답변 포함)을 삭제할까요?`)) return;

        setChatHistoryDeleting(true);
        setChatHistoryError(null);
        try {
            const idsToDelete = chatPairs
                .filter((pair) => selectedChatPairIds.includes(pair.question.id))
                .flatMap((pair) => (pair.answer ? [pair.question.id, pair.answer.id] : [pair.question.id]));
            await deleteHistories(idsToDelete);
            removeChatHistoryEntries(idsToDelete);
        } catch (err) {
            setChatHistoryError(err.message);
        } finally {
            setChatHistoryDeleting(false);
        }
    };

    const handleDeleteAllChatHistory = async () => {
        if (chatHistories.length === 0) return;
        if (!window.confirm('전체 대화 기록을 삭제할까요? 되돌릴 수 없어요.')) return;

        setChatHistoryDeleting(true);
        setChatHistoryError(null);
        try {
            await deleteAllHistories();
            setChatHistories([]);
            setChatHistoryPage(0);
            setChatHistoryHasMore(false);
            setSelectedChatPairIds([]);
            setSelectedChatId(null);
        } catch (err) {
            setChatHistoryError(err.message);
        } finally {
            setChatHistoryDeleting(false);
        }
    };

    const handleLoadMoreChatHistory = async () => {
        setChatHistoryLoadingMore(true);
        setChatHistoryError(null);
        try {
            const nextPage = chatHistoryPage + 1;
            const res = await getHistories({ page: nextPage, size: CHAT_HISTORY_SIZE });
            setChatHistories((prev) => [...prev, ...(res?.content ?? [])]);
            setChatHistoryPage(nextPage);
            setChatHistoryHasMore(!(res?.last ?? true));
        } catch (err) {
            setChatHistoryError(err.message);
        } finally {
            setChatHistoryLoadingMore(false);
        }
    };

    return (
        <section className="chat-page">
            <header className="chat-page__header">
                <span className="chat-header__avatar" aria-hidden="true"><SmileIcon /></span>
                <div className="chat-page__title">
                    <h1>AI 챗봇</h1>
                    <p>강의나 노트 화면과 달리, 지금까지 작성한 모든 노트를 넘나들며 답변합니다.</p>
                </div>
            </header>

            <div className="chat-page__body">
                <aside className="chat-page__sidebar">
                    <button type="button" className="chat-page__new-chat-btn" onClick={handleNewChat}>
                        + 새 대화
                    </button>
                    <input
                        type="text"
                        className="chat-page__search"
                        placeholder="지난 대화 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {chatHistoryError && <p role="alert" className="chat-page__sidebar-empty">불러오지 못했습니다: {chatHistoryError}</p>}

                    {chatHistoryLoading ? (
                        <p className="chat-page__sidebar-empty">불러오는 중...</p>
                    ) : chatPairs.length === 0 ? (
                        <p className="chat-page__sidebar-empty">아직 챗봇과 나눈 대화가 없습니다.</p>
                    ) : (
                        <>
                            <div className="chat-page__history-actions">
                                <label className="chat-page__history-select-all">
                                    <input
                                        type="checkbox"
                                        checked={filteredChatPairs.length > 0 && filteredChatPairs.every((pair) => selectedChatPairIds.includes(pair.question.id))}
                                        disabled={chatHistoryDeleting || filteredChatPairs.length === 0}
                                        onChange={toggleAllChatPairsSelected}
                                    />
                                    전체 선택
                                </label>
                                <button
                                    type="button"
                                    className="chat-page__history-select-delete-btn"
                                    disabled={selectedChatPairIds.length === 0 || chatHistoryDeleting}
                                    onClick={handleDeleteSelectedChatHistory}
                                >
                                    선택 삭제{selectedChatPairIds.length > 0 ? ` (${selectedChatPairIds.length})` : ''}
                                </button>
                                <button
                                    type="button"
                                    className="chat-page__history-delete-all-btn"
                                    disabled={chatHistories.length === 0 || chatHistoryDeleting}
                                    onClick={handleDeleteAllChatHistory}
                                >
                                    전체 삭제
                                </button>
                            </div>

                            <ul className="chat-page__question-list">
                                {filteredChatPairs.length === 0 ? (
                                    <li className="chat-page__sidebar-empty">검색 결과가 없습니다.</li>
                                ) : (
                                    filteredChatPairs.map((pair) => (
                                        <li key={pair.question.id} className="chat-page__question-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedChatPairIds.includes(pair.question.id)}
                                                disabled={chatHistoryDeleting || (!pair.answer && sending && selectedChatId === pair.question.id)}
                                                onChange={() => toggleChatPairSelected(pair.question.id)}
                                            />
                                            <button
                                                type="button"
                                                className={
                                                    'chat-page__question-btn' +
                                                    (pair.question.id === selectedChatId ? ' chat-page__question-btn--active' : '')
                                                }
                                                onClick={() => setSelectedChatId(pair.question.id)}
                                            >
                                                <span className="chat-page__question-text">{pair.question.message}</span>
                                                <span className="chat-page__question-meta">
                                                    {pair.question.lectureId && `강의 #${pair.question.lectureId} · `}
                                                    {pair.question.createdAt && pair.question.createdAt.replace('T', ' ').slice(0, 16)}
                                                </span>
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                            {chatHistoryHasMore && (
                                <button
                                    type="button"
                                    className="chat-page__history-load-more"
                                    onClick={handleLoadMoreChatHistory}
                                    disabled={chatHistoryLoadingMore || chatHistoryDeleting}
                                >
                                    {chatHistoryLoadingMore ? '불러오는 중...' : '더 보기'}
                                </button>
                            )}
                        </>
                    )}
                </aside>

                <div className="chat-page__main">
                    <div className="chat-page__messages">
                        {selectedChatPair ? (
                            <>
                                <ChatMessage senderRole="USER" message={selectedChatPair.question.message} />
                                {selectedChatPair.answer ? (
                                    <ChatMessage
                                        senderRole="ASSISTANT"
                                        message={selectedChatPair.answer.message}
                                        recommendedLectures={selectedChatPair.answer.recommendedLectures}
                                    />
                                ) : (
                                    <div className="chat-row chat-row-assistant">
                                        <span className="chat-avatar" aria-hidden="true"><SmileIcon /></span>
                                        <div className="chat-bubble chat-bubble-assistant chat-typing">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="chat-page__empty">
                                예: "지난주에 정리한 useEffect 노트 다시 요약해줘", "내가 CS 쪽으로 남긴 노트들 태그 정리해줘"
                            </p>
                        )}
                    </div>

                    {sendError && <p className="chat-error">{sendError}</p>}
                    <ChatInput sending={sending} onSend={handleSend} />
                </div>
            </div>
        </section>
    );
}
