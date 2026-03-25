import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { StrategyStats, SymbolStats } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import styles from './Charts.module.scss';

interface WinLossBarProps {
  strategyData: StrategyStats[] | undefined;
  symbolData: SymbolStats[] | undefined;
  isLoading: boolean;
}

type ViewMode = 'strategy' | 'symbol';

interface BarDataPoint {
  name: string;
  pnl: number;
  trades: number;
  winRate: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload as BarDataPoint;
  if (!item) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{item.name}</div>
      <div className={`${styles.tooltipValue} ${item.pnl >= 0 ? styles.tooltipValueGreen : styles.tooltipValueRed}`}>
        {formatCurrency(item.pnl)}
      </div>
      <div className={styles.tooltipLabel}>
        {item.trades} trades &middot; {item.winRate.toFixed(1)}% win rate
      </div>
    </div>
  );
}

function WinLossBar({ strategyData, symbolData, isLoading }: WinLossBarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('strategy');

  const rawData = viewMode === 'strategy' ? strategyData : symbolData;

  const chartData: BarDataPoint[] = (rawData || []).map((item) => ({
    name: viewMode === 'strategy'
      ? (item as StrategyStats).strategy_name ?? 'No Strategy'
      : (item as SymbolStats).symbol,
    pnl: item.total_pnl,
    trades: item.total_trades,
    winRate: item.win_rate,
  }));

  const isEmpty = !isLoading && chartData.length === 0;

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Performance Breakdown</span>
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'strategy' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('strategy')}
          >
            By Strategy
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'symbol' ? styles.toggleBtnActive : ''}`}
            onClick={() => setViewMode('symbol')}
          >
            By Symbol
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className={styles.emptyChart}>Loading...</div>
      ) : isEmpty ? (
        <div className={styles.emptyChart}>No data available</div>
      ) : (
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }} />
              <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default WinLossBar;
