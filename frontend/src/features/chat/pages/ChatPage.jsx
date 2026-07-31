import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { streamMessage, getHistories, deleteHistories, deleteAllHistories } from '../api/chat';
import { getMyNotes } from '../../note/api/note';
import ChatMessage, { SmileIcon } from '../ChatMessage';
import ChatInput from '../ChatInput';
import Timer from '../../pomodoro/Timer';
import StatsAndHistory from '../../pomodoro/StatsAndHistory';
import '../../pomodoro/pomodoro.css';
import '../chat.css';
import './ChatPage.css';

// 지난 대화 기록 한 페이지당 개수. 질문+답변이 원시 행 2개라 실제로 보이는 "쌍"은 이 절반 정도다.
// 넉넉하게 잡아서 어지간한 사용자는 첫 로드에 전체가 다 보이게 하고, 그보다 많으면 스크롤이
// 바닥에 닿을 때 다음 페이지를 이어 불러온다 (핸들러: handleQuestionListScroll).
const CHAT_HISTORY_SIZE = 100;

// 노트 상세 페이지의 note-detail-pomodoro__badge와 톤을 맞춘 시계 아이콘.
function ClockIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </svg>
    );
}

// 강의 시청/노트 상세 페이지의 학습 챗봇은 그 강의·노트로 컨텍스트가 좁혀지지만,
// 이 페이지는 lectureId/noteId를 아예 넘기지 않아 사용자가 지금까지 쓴 모든 노트를
// 대상으로 검색한다 (ChatService.buildNoteContext가 lectureId===null이면
// 전체 노트에서 찾도록 이미 되어 있음 — 백엔드 변경 없이 그대로 재사용).
//
// "새 대화 작성칸"과 "지난 대화 기록"을 따로 두지 않고 하나로 합쳤다: 질문을 보내면
// 그 자리에서 목록 맨 위에 새 항목으로 얹히고 바로 선택되는 식이라, 방금 물어본 것도
// 지난 기록 목록의 맨 위 칸일 뿐이다. 검색창은 지금까지 불러온 목록 안에서만 필터링한다
// (서버에 전체 검색 API가 없어 이미 불러온 페이지 범위로 한정).
//
// selectedRootId는 "지금 보고 있는 하나의 질문"이 아니라 "대화를 이어갈 기준점(루트 질문 id)"이다.
// 오른쪽 화면은 그 루트에 속한 모든 질문/답변을 시간순으로 쭉 보여주고(visibleChatPairs), 그 상태에서
// 새 질문을 보내면 rootQuestionId를 그대로 실어 보내 서버에도 같은 대화로 저장되고, 화면도 그 대화
// 맨 아래에 계속 붙는다. 이 묶음은 ChatHistory.rootQuestionId로 서버에 영구 저장되므로(새로고침해도
// 유지됨), 강의 시청/노트 상세 화면의 전용 학습 챗봇에서 이어서 물어본 대화도 똑같이 여기 목록에
// 새 항목을 만들지 않고 하나로 묶여 보인다 — 예전엔(세션 메모리로만 구분했을 때) 이 페이지 자체에서
// 보낸 것만 묶였고, 다른 화면에서 이어간 대화는 여전히 각자 새 항목으로 떴다.
export default function ChatPage() {
    const [chatHistories, setChatHistories] = useState([]);
    const [chatHistoryPage, setChatHistoryPage] = useState(0);
    const [chatHistoryHasMore, setChatHistoryHasMore] = useState(false);
    const [chatHistoryLoading, setChatHistoryLoading] = useState(true);
    const [chatHistoryLoadingMore, setChatHistoryLoadingMore] = useState(false);
    const [chatHistoryError, setChatHistoryError] = useState(null);

    const [selectedRootId, setSelectedRootId] = useState(null); // null = "새 대화" 화면
    const [selectedChatPairIds, setSelectedChatPairIds] = useState([]); // 삭제용 다중 선택
    const [chatHistoryDeleting, setChatHistoryDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(null);

    // 컨텍스트 제어: 기본은 전체 노트 대상이지만, 사용자가 특정 노트 몇 개로 범위를 좁힐 수 있다.
    // myNotes는 팝오버를 처음 열 때 한 번만 불러온다(지연 로딩).
    const [myNotes, setMyNotes] = useState([]);
    const [myNotesLoading, setMyNotesLoading] = useState(false);
    const [selectedNoteIds, setSelectedNoteIds] = useState([]);
    const [noteContextOpen, setNoteContextOpen] = useState(false);

    // 뽀모도로: NoteDetail.jsx와 같은 방식(페이지에 직접 임베드)을 따르되, 이 페이지는
    // 특정 노트/강의에 매인 화면이 아니라 헤더에 배지 버튼 하나로 접어두고 필요할 때만 펼친다.
    const [pomodoroOpen, setPomodoroOpen] = useState(false);
    const [pomodoroRefreshKey, setPomodoroRefreshKey] = useState(0);

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

    // 왼쪽 목록에는 그 자체가 새 대화의 시작인(rootQuestionId가 없는) 질문만 보인다. 이어서 한
    // 질문(rootQuestionId가 채워짐)은 목록에서 빼고, 그 루트를 선택했을 때 오른쪽 화면에서만 보여준다.
    const topLevelChatPairs = useMemo(
        () => chatPairs.filter((pair) => pair.question.rootQuestionId == null),
        [chatPairs]
    );

    const filteredChatPairs = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();
        if (!keyword) return topLevelChatPairs;
        return topLevelChatPairs.filter((pair) => pair.question.message.toLowerCase().includes(keyword));
    }, [topLevelChatPairs, searchQuery]);

    // rootQuestionId는 서버에 영구 저장되므로, 같은 루트에 속한 질문들이 최신순 목록에서
    // 서로 떨어져 있을 수 있다(다른 화면에서 중간에 다른 대화를 했을 수도 있음) — 그래서
    // "앵커의 인덱스까지 자르기"가 아니라 "루트가 같은 것만 걸러서 시간순으로 정렬"한다.
    // 낙관적으로 얹은 항목은 아직 실제 id가 없어 'pending-...' 문자열이라, 항상 맨 뒤(가장 최근)로 취급한다.
    const idRank = (id) => (typeof id === 'number' ? id : Number.POSITIVE_INFINITY);
    const visibleChatPairs = useMemo(() => {
        if (selectedRootId == null) return [];
        return chatPairs
            .filter((pair) => pair.question.id === selectedRootId || pair.question.rootQuestionId === selectedRootId)
            .sort((a, b) => idRank(a.question.id) - idRank(b.question.id));
    }, [chatPairs, selectedRootId]);
    const messagesEndRef = useRef(null);

    // 새 메시지가 이어지거나 스트리밍 중일 때 항상 대화창 맨 아래로 따라간다.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleChatPairs, sending]);

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
        // 하나의 목록/화면으로 보이게 하는 핵심 트릭이다. rootQuestionId는 "새 대화"(null)였으면
        // 안 실어 보내고, 이어서 하는 거면 지금 보고 있는 루트를 그대로 실어 보낸다 — 서버가 이
        // 값으로 같은 대화에 묶어 저장하므로, 새로고침해도, 다른 화면(강의/노트 챗봇)에서 이어가도
        // 계속 하나의 대화로 유지된다.
        const pendingId = `pending-${Date.now()}`;
        const rootQuestionId = selectedRootId;
        setChatHistories((prev) => [
            { id: pendingId, senderRole: 'USER', message, createdAt: new Date().toISOString(), rootQuestionId },
            ...prev,
        ]);

        // 스트리밍 체감 속도 개선: 토큰이 도착하는 즉시 답변 자리를 만들어(최초 1회) 이어붙인다.
        // 스트림이 끝나면 서버에 저장된 최종본(따옴표 치환·강의 추천 포함)으로 통째로 바꿔치기한다.
        const answerId = `pending-answer-${Date.now()}`;
        let streamedText = '';
        let answerCreated = false;
        const appendChunk = (chunk) => {
            streamedText += chunk;
            setChatHistories((prev) => {
                if (!answerCreated) {
                    answerCreated = true;
                    return [
                        { id: answerId, senderRole: 'ASSISTANT', message: streamedText, createdAt: new Date().toISOString() },
                        ...prev,
                    ];
                }
                return prev.map((entry) => (entry.id === answerId ? { ...entry, message: streamedText } : entry));
            });
        };

        try {
            const noteIds = selectedNoteIds.length > 0 ? selectedNoteIds : undefined;
            const answer = await streamMessage({ message, noteIds, rootQuestionId }, appendChunk);
            setChatHistories((prev) => prev.map((entry) => {
                if (entry.id === answerId) return answer;
                // 임시 id(pending-...)를 서버가 실제로 저장한 id로 바꿔치기해야, 새로고침 없이도
                // 이 질문을 기준으로 다시 선택하거나 다음 이어가기 계산이 정확히 맞아떨어진다.
                // rootQuestionId는 여기서 "보낸 값"을 그대로 써야 한다 — answer.rootQuestionId는
                // "이 질문 자체가 새 대화의 시작이어도" 다음 이어가기를 위해 이 질문 자신의 id로
                // 채워져 오므로, 그걸 그대로 쓰면 새 대화로 시작한 질문마저 non-null이 되어
                // "최상위 항목" 필터(rootQuestionId == null)에서 답변 오자마자 사라져버린다.
                if (entry.id === pendingId) return { ...entry, id: answer.questionId, rootQuestionId };
                return entry;
            }));
            // 새 대화였다면 이제부터는 방금 저장된 이 대화의 루트를 계속 이어간다.
            setSelectedRootId(answer.rootQuestionId);
        } catch (err) {
            setSendError(err.message);
            setChatHistories((prev) => prev.filter((entry) => entry.id !== answerId));
        } finally {
            setSending(false);
        }
    };

    const handleNewChat = () => {
        setSelectedRootId(null);
        setSendError(null);
    };

    const toggleNoteContextOpen = () => {
        const willOpen = !noteContextOpen;
        setNoteContextOpen(willOpen);
        if (willOpen && myNotes.length === 0 && !myNotesLoading) {
            setMyNotesLoading(true);
            getMyNotes({ size: 100 })
                .then((page) => setMyNotes(page?.content ?? []))
                .catch(() => {})
                .finally(() => setMyNotesLoading(false));
        }
    };

    const toggleNoteSelected = (noteId) => {
        setSelectedNoteIds((prev) =>
            prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
        );
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
        if (deletedSet.has(selectedRootId)) setSelectedRootId(null);
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
            setSelectedRootId(null);
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

    // "더 보기" 버튼 대신, 목록을 아래로 스크롤해서 바닥 근처에 닿으면 다음 페이지를 이어 불러온다.
    const handleQuestionListScroll = (e) => {
        if (chatHistoryLoadingMore || !chatHistoryHasMore) return;
        const el = e.currentTarget;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        if (nearBottom) handleLoadMoreChatHistory();
    };

    return (
        <section className={'chat-page' + (pomodoroOpen ? ' chat-page--with-pomodoro' : '')}>
            <header className="chat-page__header">
                <span className="chat-header__avatar" aria-hidden="true"><SmileIcon /></span>
                <div className="chat-page__title">
                    <h1>AI 챗봇</h1>
                    <p>강의나 노트 화면과 달리, 지금까지 작성한 모든 노트를 넘나들며 답변합니다.</p>
                </div>

                <button
                    type="button"
                    className={'chat-page__pomodoro-toggle' + (pomodoroOpen ? ' chat-page__pomodoro-toggle--active' : '')}
                    onClick={() => setPomodoroOpen((v) => !v)}
                    aria-expanded={pomodoroOpen}
                >
                    <ClockIcon /> 타이머
                </button>
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

                            <ul className="chat-page__question-list" onScroll={handleQuestionListScroll}>
                                {filteredChatPairs.length === 0 ? (
                                    <li className="chat-page__sidebar-empty">검색 결과가 없습니다.</li>
                                ) : (
                                    <>
                                        {filteredChatPairs.map((pair) => (
                                            <li key={pair.question.id} className="chat-page__question-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedChatPairIds.includes(pair.question.id)}
                                                    disabled={chatHistoryDeleting || (!pair.answer && sending)}
                                                    onChange={() => toggleChatPairSelected(pair.question.id)}
                                                />
                                                <button
                                                    type="button"
                                                    className={
                                                        'chat-page__question-btn' +
                                                        (pair.question.id === selectedRootId ? ' chat-page__question-btn--active' : '')
                                                    }
                                                    onClick={() => setSelectedRootId(pair.question.id)}
                                                >
                                                    <span className="chat-page__question-text">{pair.question.message}</span>
                                                    <span className="chat-page__question-meta">
                                                        {pair.question.lectureId && `강의 #${pair.question.lectureId} · `}
                                                        {pair.question.createdAt && pair.question.createdAt.replace('T', ' ').slice(0, 16)}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                        {chatHistoryLoadingMore && (
                                            <li className="chat-page__sidebar-empty">불러오는 중...</li>
                                        )}
                                    </>
                                )}
                            </ul>
                        </>
                    )}
                </aside>

                <div className="chat-page__main">
                    <div className="chat-page__messages">
                        {visibleChatPairs.length > 0 ? (
                            <>
                                {visibleChatPairs.map((pair) => (
                                    <Fragment key={pair.question.id}>
                                        <ChatMessage senderRole="USER" message={pair.question.message} />
                                        {pair.answer ? (
                                            <ChatMessage
                                                senderRole="ASSISTANT"
                                                message={pair.answer.message}
                                                recommendedLectures={pair.answer.recommendedLectures}
                                            />
                                        ) : (
                                            <div className="chat-row chat-row-assistant">
                                                <span className="chat-avatar" aria-hidden="true"><SmileIcon /></span>
                                                <div className="chat-bubble chat-bubble-assistant chat-typing">
                                                    <span /><span /><span />
                                                </div>
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        ) : (
                            <p className="chat-page__empty">
                                예: "지난주에 정리한 useEffect 노트 다시 요약해줘", "내가 CS 쪽으로 남긴 노트들 태그 정리해줘"
                            </p>
                        )}
                    </div>

                    <div className="chat-page__context-bar">
                        <span className="chat-page__context-label">복습 범위</span>
                        {selectedNoteIds.length === 0 ? (
                            <span className="chat-page__context-chip chat-page__context-chip--all">전체 노트</span>
                        ) : (
                            selectedNoteIds.map((noteId) => {
                                const note = myNotes.find((n) => n.id === noteId);
                                return (
                                    <span key={noteId} className="chat-page__context-chip">
                                        {note ? note.title : `노트 #${noteId}`}
                                        <button
                                            type="button"
                                            onClick={() => toggleNoteSelected(noteId)}
                                            aria-label="범위에서 빼기"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                );
                            })
                        )}
                        <div className="chat-page__context-picker">
                            <button
                                type="button"
                                className="chat-page__context-pick-btn"
                                onClick={toggleNoteContextOpen}
                            >
                                노트 선택 {noteContextOpen ? '▲' : '▼'}
                            </button>
                            {noteContextOpen && (
                                <div className="chat-page__context-popover">
                                    {myNotesLoading ? (
                                        <p className="chat-page__sidebar-empty">불러오는 중...</p>
                                    ) : myNotes.length === 0 ? (
                                        <p className="chat-page__sidebar-empty">작성한 노트가 없습니다.</p>
                                    ) : (
                                        <ul className="chat-page__context-note-list">
                                            {myNotes.map((note) => (
                                                <li key={note.id}>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedNoteIds.includes(note.id)}
                                                            onChange={() => toggleNoteSelected(note.id)}
                                                        />
                                                        <span>{note.title}</span>
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {sendError && <p className="chat-error">{sendError}</p>}
                    <ChatInput sending={sending} onSend={handleSend} />
                </div>

                {pomodoroOpen && (
                    <aside className="chat-page__pomodoro-panel">
                        <div className="chat-page__pomodoro-panel-header">
                            <span className="chat-page__pomodoro-panel-badge"><ClockIcon /></span>
                            <span className="chat-page__pomodoro-panel-title">타이머</span>
                        </div>
                        <Timer onFinished={() => setPomodoroRefreshKey((k) => k + 1)} />
                        <div className="chat-page__pomodoro-history">
                            <StatsAndHistory refreshKey={pomodoroRefreshKey} />
                        </div>
                    </aside>
                )}
            </div>
        </section>
    );
}
