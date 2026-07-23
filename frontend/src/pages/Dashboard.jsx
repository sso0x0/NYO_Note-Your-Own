import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';

function Dashboard() {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState({});

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/login');
    };

    const handleDateClick = (dateKey) => {
        setSelectedDate(dateKey);
        const memo = prompt(`${dateKey}에 일정을 입력하세요`, events[dateKey] || '');
        if (memo === null) return;

        setEvents((prev) => {
            const next = { ...prev };
            if (memo.trim() === '') {
                delete next[dateKey];
            } else {
                next[dateKey] = memo;
            }
            return next;
        });
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '28px', margin: 0 }}>NYO 워크스페이스</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--bg)',
                        color: 'var(--text-h)',
                    }}
                >
                    로그아웃
                </button>
            </div>

            <Calendar onDateClick={handleDateClick} events={events} />

            {selectedDate && (
                <p style={{ marginTop: '1.5rem', color: 'var(--text)', fontSize: '14px' }}>
                    선택한 날짜: <strong style={{ color: 'var(--text-h)' }}>{selectedDate}</strong>
                </p>
            )}
        </div>
    );
}

export default Dashboard;