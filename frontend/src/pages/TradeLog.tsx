import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '../hooks/useTrades';
import type { TradeFilters } from '../types';
import { formatDate, formatCurrency, formatRR } from '../utils/formatters';
import { OutcomeBadge, DirectionBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FilterBar from '../components/FilterBar/FilterBar';
import styles from './TradeLog.module.scss';

const PAGE_SIZE = 20;

type SortField = 'trade_date' | 'symbol' | 'direction' | 'outcome' | 'rr_actual' | 'pnl_net' | 'fees';

function TradeLog() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TradeFilters>({});
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('trade_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const queryFilters: TradeFilters = {
    ...filters,
    page,
    limit: PAGE_SIZE,
    sort: sortField,
    order: sortOrder,
  };

  const { data, isLoading } = useTrades(queryFilters);

  const trades = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('desc');
      }
      setPage(1);
    },
    [sortField]
  );

  const handleApplyFilters = (f: TradeFilters) => {
    setFilters(f);
    setPage(1);
  };

  const getPnlClass = (pnl: number | null) => {
    if (pnl == null) return '';
    if (pnl > 0) return styles.pnlPositive;
    if (pnl < 0) return styles.pnlNegative;
    return styles.pnlNeutral;
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <span className={styles.sortIcon}>
        {sortOrder === 'asc' ? '\u25B2' : '\u25BC'}
      </span>
    );
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating || rating <= 0) return null;
    return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Trade Log</h1>
          <p>
            {total} trade{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Button onClick={() => navigate('/trades/new')}>+ New Trade</Button>
      </div>

      <FilterBar filters={filters} onApply={handleApplyFilters} />

      {isLoading ? (
        <div className={styles.empty}>
          <div className={styles.emptyText}>Loading trades...</div>
        </div>
      ) : trades.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <div className={styles.emptyTitle}>No Trades Found</div>
          <div className={styles.emptyText}>
            {Object.keys(filters).length > 0
              ? 'No trades match the current filters. Try adjusting your criteria.'
              : 'Start by logging your first trade to see it here.'}
          </div>
          {Object.keys(filters).length === 0 && (
            <Button onClick={() => navigate('/trades/new')}>+ New Trade</Button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th
                  className={`${styles.th} ${sortField === 'trade_date' ? styles.thActive : ''}`}
                  onClick={() => handleSort('trade_date')}
                >
                  Date{renderSortIndicator('trade_date')}
                </th>
                <th
                  className={`${styles.th} ${sortField === 'symbol' ? styles.thActive : ''}`}
                  onClick={() => handleSort('symbol')}
                >
                  Symbol{renderSortIndicator('symbol')}
                </th>
                <th
                  className={`${styles.th} ${sortField === 'direction' ? styles.thActive : ''}`}
                  onClick={() => handleSort('direction')}
                >
                  Direction{renderSortIndicator('direction')}
                </th>
                <th
                  className={`${styles.th} ${sortField === 'outcome' ? styles.thActive : ''}`}
                  onClick={() => handleSort('outcome')}
                >
                  Outcome{renderSortIndicator('outcome')}
                </th>
                <th
                  className={`${styles.th} ${sortField === 'rr_actual' ? styles.thActive : ''}`}
                  onClick={() => handleSort('rr_actual')}
                >
                  RR{renderSortIndicator('rr_actual')}
                </th>
                <th
                  className={`${styles.th} ${sortField === 'pnl_net' ? styles.thActive : ''}`}
                  onClick={() => handleSort('pnl_net')}
                >
                  P&L{renderSortIndicator('pnl_net')}
                </th>
                <th
                  className={`${styles.th} ${sortField === 'fees' ? styles.thActive : ''}`}
                  onClick={() => handleSort('fees')}
                >
                  Fees{renderSortIndicator('fees')}
                </th>
                <th className={styles.th}>Strategy</th>
                <th className={styles.th}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const pnlNet = parseFloat(trade.pnl_net ?? '0');
                const fees = parseFloat(trade.fees ?? '0');
                const rrActual = trade.rr_actual != null ? parseFloat(trade.rr_actual) : null;

                return (
                  <tr
                    key={trade.id}
                    className={styles.tr}
                    onClick={() => navigate(`/trades/${trade.id}`)}
                  >
                    <td className={styles.td}>{formatDate(trade.trade_date)}</td>
                    <td className={`${styles.td} ${styles.mono}`}>{trade.symbol}</td>
                    <td className={styles.td}>
                      <DirectionBadge direction={trade.direction} />
                    </td>
                    <td className={styles.td}>
                      {trade.outcome ? <OutcomeBadge outcome={trade.outcome} /> : '--'}
                    </td>
                    <td className={`${styles.td} ${styles.mono}`}>
                      {formatRR(rrActual)}
                    </td>
                    <td className={`${styles.td} ${styles.mono} ${getPnlClass(pnlNet)}`}>
                      {trade.pnl_net != null ? formatCurrency(pnlNet) : '--'}
                    </td>
                    <td className={`${styles.td} ${styles.mono}`}>
                      {formatCurrency(fees)}
                    </td>
                    <td className={styles.td}>
                      {trade.strategy_name ? (
                        <span className={styles.strategyCell}>
                          <span
                            className={styles.strategyDot}
                            style={{
                              backgroundColor: '#6b7280',
                            }}
                          />
                          {trade.strategy_name}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className={styles.td}>
                      {getRatingStars(trade.rating) ? (
                        <span className={styles.ratingStars}>{getRatingStars(trade.rating)}</span>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className={styles.pageButtons}>
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeLog;
