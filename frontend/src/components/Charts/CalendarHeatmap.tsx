import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import type { CalendarEntry } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import styles from './Charts.module.scss';

interface CalendarHeatmapProps {
  data: CalendarEntry[] | undefined;
  isLoading: boolean;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getHeatClass(pnl: number, hasTrades: boolean): string {
  if (!hasTrades) return styles.calendarDayNoTrades;
  if (pnl > 500) return styles.calendarDayProfit3;
  if (pnl > 100) return styles.calendarDayProfit2;
  if (pnl > 0) return styles.calendarDayProfit1;
  if (pnl < -500) return styles.calendarDayLoss3;
  if (pnl < -100) return styles.calendarDayLoss2;
  if (pnl < 0) return styles.calendarDayLoss1;
  return styles.calendarDayNoTrades;
}

function CalendarHeatmap({ data, isLoading }: CalendarHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    if (data) {
      data.forEach((entry) => {
        // Normalize date to yyyy-MM-dd (API may return full ISO timestamp)
        const key = entry.date.slice(0, 10);
        map.set(key, entry);
      });
    }
    return map;
  }, [data]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const handlePrev = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNext = () => setCurrentMonth((m) => addMonths(m, 1));

  if (isLoading) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Calendar</span>
        </div>
        <div className={styles.emptyChart}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Calendar</span>
      </div>
      <div className={styles.calendarWrapper}>
        <div className={styles.calendarNav}>
          <button className={styles.calendarNavBtn} onClick={handlePrev}>
            &#8249;
          </button>
          <span className={styles.calendarMonth}>
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button className={styles.calendarNavBtn} onClick={handleNext}>
            &#8250;
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {DAY_LABELS.map((label) => (
            <div key={label} className={styles.calendarDayHeader}>
              {label}
            </div>
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const entry = calendarMap.get(dateStr);
            const hasTrades = !!entry && entry.trade_count > 0;
            const isHovered = hoveredDay === dateStr;

            if (!isCurrentMonth) {
              return <div key={dateStr} className={`${styles.calendarDay} ${styles.calendarDayEmpty}`} />;
            }

            const heatClass = hasTrades ? getHeatClass(entry!.pnl_net, true) : styles.calendarDayNoTrades;

            return (
              <div
                key={dateStr}
                className={`${styles.calendarDay} ${heatClass}`}
                onMouseEnter={() => setHoveredDay(dateStr)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <span className={styles.calendarDayNumber}>{day.getDate()}</span>
                {hasTrades && (
                  <div className={styles.calendarDayInfo}>
                    <span
                      className={styles.calendarDayPnl}
                      style={{ color: entry!.pnl_net >= 0 ? '#10b981' : '#ef4444' }}
                    >
                      {entry!.pnl_net >= 0 ? '+' : ''}{entry!.pnl_net.toFixed(0)}$
                    </span>
                    <span className={styles.calendarDayCount}>
                      {entry!.trade_count}t
                    </span>
                  </div>
                )}
                {isHovered && hasTrades && (
                  <div className={styles.calendarTooltip}>
                    <div className={styles.tooltipDate}>{format(day, 'MMM d, yyyy')}</div>
                    <div
                      className={styles.tooltipPnl}
                      style={{ color: entry!.pnl_net >= 0 ? '#10b981' : '#ef4444' }}
                    >
                      {formatCurrency(entry!.pnl_net)}
                    </div>
                    <div className={styles.tooltipTrades}>
                      {entry!.trade_count} trade{entry!.trade_count !== 1 ? 's' : ''} &middot;{' '}
                      {entry!.pnl_net >= 0 ? 'Profit' : 'Loss'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.calendarLegend}>
          <span>Loss</span>
          <div className={styles.legendSquare} style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
          <div className={styles.legendSquare} style={{ background: 'rgba(239, 68, 68, 0.3)' }} />
          <div className={styles.legendSquare} style={{ background: 'rgba(239, 68, 68, 0.15)' }} />
          <div className={styles.legendSquare} style={{ background: 'rgba(55, 65, 81, 0.3)' }} />
          <div className={styles.legendSquare} style={{ background: 'rgba(16, 185, 129, 0.15)' }} />
          <div className={styles.legendSquare} style={{ background: 'rgba(16, 185, 129, 0.3)' }} />
          <div className={styles.legendSquare} style={{ background: 'rgba(16, 185, 129, 0.5)' }} />
          <span>Profit</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarHeatmap;
