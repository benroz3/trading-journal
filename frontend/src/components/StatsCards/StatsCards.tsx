import type { StatSummary } from '../../types';
import { formatCurrency, formatRR } from '../../utils/formatters';
import styles from './StatsCards.module.scss';

interface StatsCardsProps {
  data: StatSummary | undefined;
  isLoading: boolean;
}

function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const pnlColor = data.total_pnl > 0 ? styles.valueGreen : data.total_pnl < 0 ? styles.valueRed : '';

  const cards = [
    {
      label: 'Total P&L',
      value: formatCurrency(data.total_pnl),
      valueClass: pnlColor,
      sub: `${data.total_trades} trades | Fees: ${formatCurrency(data.total_fees)}`,
    },
    {
      label: 'Win Rate',
      value: `${(data.win_rate ?? 0).toFixed(1)}%`,
      valueClass: data.win_rate >= 50 ? styles.valueGreen : styles.valueRed,
      sub: `${(data.loss_rate ?? 0).toFixed(1)}% loss | ${(data.be_rate ?? 0).toFixed(1)}% BE`,
    },
    {
      label: 'Profit Factor',
      value: data.profit_factor === 0 ? 'N/A' : (data.profit_factor ?? 0).toFixed(2),
      valueClass: data.profit_factor >= 1.5 ? styles.valueGreen : data.profit_factor >= 1 ? styles.valueYellow : styles.valueRed,
      sub: '',
    },
    {
      label: 'Avg Risk/Reward',
      value: formatRR(data.avg_rr),
      valueClass: (data.avg_rr ?? 0) >= 1.5 ? styles.valueGreen : (data.avg_rr ?? 0) >= 1 ? styles.valueYellow : styles.valueRed,
      sub: '',
    },
    {
      label: 'Total Trades',
      value: (data.total_trades ?? 0).toString(),
      valueClass: '',
      sub: `Plan adherence: ${(data.plan_adherence ?? 0).toFixed(1)}%`,
    },
    {
      label: 'Max Drawdown',
      value: formatCurrency(data.max_drawdown),
      valueClass: styles.valueRed,
      sub: '',
    },
  ];

  const secondaryStats = [
    { label: 'Expectancy', value: formatCurrency(data.expectancy) },
    { label: 'Avg Winner', value: formatCurrency(data.avg_winner) },
    { label: 'Avg Loser', value: formatCurrency(data.avg_loser) },
    { label: 'Largest Winner', value: formatCurrency(data.largest_winner) },
    { label: 'Largest Loser', value: formatCurrency(data.largest_loser) },
    { label: 'Total Fees', value: formatCurrency(data.total_fees) },
    { label: 'Avg Rating', value: data.avg_rating != null ? data.avg_rating.toFixed(1) : '--' },
    { label: 'Avg Duration', value: data.avg_trade_duration != null ? `${data.avg_trade_duration.toFixed(0)} min` : '--' },
  ];

  return (
    <>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={styles.card}>
            <span className={styles.label}>{card.label}</span>
            <span className={`${styles.value} ${card.valueClass}`}>{card.value}</span>
            {card.sub && <span className={styles.sub}>{card.sub}</span>}
          </div>
        ))}
      </div>
      <div className={styles.secondaryGrid}>
        {secondaryStats.map((stat) => (
          <div key={stat.label} className={styles.secondaryCard}>
            <span className={styles.secondaryLabel}>{stat.label}</span>
            <span className={styles.secondaryValue}>{stat.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default StatsCards;
