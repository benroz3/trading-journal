import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { EquityCurvePoint } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './Charts.module.scss';

interface EquityCurveProps {
  data: EquityCurvePoint[] | undefined;
  isLoading: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const pnl = payload.find((p: any) => p.dataKey === 'cumulative_pnl')?.value;
  const dd = payload.find((p: any) => p.dataKey === 'drawdown')?.value;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{formatDate(label)}</div>
      <div className={`${styles.tooltipValue} ${pnl >= 0 ? styles.tooltipValueGreen : styles.tooltipValueRed}`}>
        {formatCurrency(pnl)}
      </div>
      {dd < 0 && (
        <div className={`${styles.tooltipValue} ${styles.tooltipValueRed}`}>
          DD: {formatCurrency(dd)}
        </div>
      )}
    </div>
  );
}

function EquityCurve({ data, isLoading }: EquityCurveProps) {
  if (isLoading) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Equity Curve</span>
        </div>
        <div className={styles.emptyChart}>Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Equity Curve</span>
        </div>
        <div className={styles.emptyChart}>No data available</div>
      </div>
    );
  }

  // The API now provides drawdown directly; ensure negative values for chart display
  const chartData = data.map((point) => ({
    date: point.date.slice(0, 10),
    cumulative_pnl: point.cumulative_pnl,
    drawdown: point.drawdown < 0 ? point.drawdown : -Math.abs(point.drawdown),
  }));

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>Equity Curve</span>
      </div>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              tickFormatter={(val) => {
                try {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                } catch {
                  return val;
                }
              }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              tickFormatter={(val) => `$${val.toLocaleString()}`}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="drawdown"
              fill="url(#drawdownGradient)"
              stroke="transparent"
              baseLine={0}
            />
            <Area
              type="monotone"
              dataKey="cumulative_pnl"
              fill="url(#equityGradient)"
              stroke="transparent"
            />
            <Line
              type="monotone"
              dataKey="cumulative_pnl"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', stroke: '#1e3a5f' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default EquityCurve;
