import { useState } from 'react';
import './Calendar.css';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function Calendar({ onDateClick, events = {} }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const isToday = (day) =>
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const dateKey = (day) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        cells.push(null);
    }
    for (let day = 1; day <= lastDateOfMonth; day++) {
        cells.push(day);
    }

    return (
        <div className="calendar-wrap">
            <div className="calendar-header">
                <button onClick={handlePrevMonth} className="calendar-nav-btn" aria-label="이전 달">
                    ◀
                </button>
                <h2 className="calendar-title">{year}년 {month + 1}월</h2>
                <button onClick={handleNextMonth} className="calendar-nav-btn" aria-label="다음 달">
                    ▶
                </button>
            </div>

            <div className="calendar-grid calendar-day-names">
                {DAY_NAMES.map((name, i) => (
                    <div
                        key={name}
                        className="calendar-day-name"
                        style={{ color: i === 0 ? '#e05252' : i === 6 ? '#4d7fd6' : 'var(--text)' }}
                    >
                        {name}
                    </div>
                ))}
            </div>

            <div className="calendar-grid">
                {cells.map((day, idx) => {
                    if (day === null) {
                        return <div key={`empty-${idx}`} className="calendar-cell calendar-cell-empty" />;
                    }
                    const key = dateKey(day);
                    const hasEvent = Boolean(events[key]);

                    return (
                        <div
                            key={key}
                            onClick={() => onDateClick && onDateClick(key)}
                            className={`calendar-cell${isToday(day) ? ' calendar-cell-today' : ''}`}
                        >
                            <div className={`calendar-cell-day${isToday(day) ? ' calendar-cell-day-today' : ''}`}>
                                {day}
                            </div>
                            {hasEvent && <div className="calendar-cell-event">{events[key]}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Calendar;