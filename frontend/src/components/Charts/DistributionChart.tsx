import { useMemo } from 'react';
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
import type { EquityCurvePoint } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import styles from './Charts.module.scss';

interface DistributionChartProps {
  equityCurveData: EquityCurvePoint[] | undefined;
  isLoading: boolean;
}

interface Bucket {
  label: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
  midpoint: number;
}

function computeBuckets(data: EquityCurvePoint[], numBuckets: number = 12): Bucket[] {
  // Compute daily P&L deltas from cumulative curve
  const dailyPnl: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      dailyPnl.push(data[i].cumulative_pnl);
    } else {
      dailyPnl.push(data[i].cumulative_pnl - data[i - 1].cumulative_pnl);
    }
  }

  if (dailyPnl.length === 0) return [];

  const min = Math.min(...dailyPnl);
  const max = Math.max(...dailyPnl);

  if (min === max) {
    return [
      {
        label: formatCurrency(min),
        rangeStart: min,
        rangeEnd: max,
        count: dailyPnl.length,
        midpoint: min,
      },
    ];
  }

  const range = max - min;
  const bucketSize = range / numBuckets;

  const buckets: Bucket[] = [];
  for (let i = 0; i < numBuckets; i++) {
    const start = min + i * bucketSize;
    const end = start + bucketSize;
    const midpoint = (start + end) / 2;
    buckets.push({
      label: `$${Math.round(start)}`,
      rangeStart: start,
      rangeEnd: end,
      count: 0,
      midpoint,
    });
  }

  dailyPnl.forEach((val) => {
    let idx = Math.floor((val - min) / bucketSize);
    if (idx >= numBuckets) idx = numBuckets - 1;
    if (idx < 0) idx = 0;
    buckets[idx].count++;
  });

  return buckets;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const bucket = payload[0]?.payload as Bucket;
  if (!bucket) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>
        {formatCurrency(bucket.rangeStart)} to {formatCurrency(bucket.rangeEnd)}
      </div>
      <div className={styles.tooltipValue}>
        {bucket.count} trade{bucket.count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function DistributionChart({ equityCurveData, isLoading }: DistributionChartProps) {
  const buckets = useMemo(() => {
    if (!equityCurveData || equityCurveData.length === 0) return [];
    return computeBuckets(equityCurveData);
  }, [equityCurveData]);

  const isEmpty = !isLoading && buckets.length === 0;

  // Find the bucket index closest to $0 for the reference line
  const zeroIndex = useMemo(() => {
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].rangeStart <= 0 && buckets[i].rangeEnd >= 0) {
        return buckets[i].label;
      }
    }
    return undefined;
  }, [buckets]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>P&L Distribution</span>
      </div>
      {isLoading ? (
        <div className={styles.emptyChart}>Loading...</div>
      ) : isEmpty ? (
        <div className={styles.emptyChart}>No data available</div>
      ) : (
        <div className={styles.chartBody}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                interval={1}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                allowDecimals={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }} />
              {zeroIndex !== undefined && (
                <ReferenceLine x={zeroIndex} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} />
              )}
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40}>
                {buckets.map((bucket, index) => (
                  <Cell
                    key={index}
                    fill={bucket.midpoint >= 0 ? '#10b981' : '#ef4444'}
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

export default DistributionChart;
