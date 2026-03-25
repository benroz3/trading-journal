import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrade, useDeleteTrade } from '../hooks/useTrades';
import { formatDateTime, formatCurrency, formatRR } from '../utils/formatters';
import { OutcomeBadge, DirectionBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ImageViewer from '../components/ImageViewer/ImageViewer';
import styles from './TradeDetail.module.scss';

function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tradeId = id || undefined;
  const { data: trade, isLoading } = useTrade(tradeId);
  const deleteTrade = useDeleteTrade();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!tradeId) return;
    try {
      await deleteTrade.mutateAsync(tradeId);
      navigate('/trades');
    } catch {
      // toast handled by hook
    }
  };

  const getPnlClass = (pnl: number | null) => {
    if (pnl == null) return styles.pnlNeutral;
    if (pnl > 0) return styles.pnlPositive;
    if (pnl < 0) return styles.pnlNegative;
    return styles.pnlNeutral;
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading trade...</div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          Trade not found.
          <br />
          <Button variant="ghost" onClick={() => navigate('/trades')} style={{ marginTop: 16 }}>
            Back to Trade Log
          </Button>
        </div>
      </div>
    );
  }

  const pnlNet = trade.pnl_net != null ? parseFloat(trade.pnl_net) : null;
  const pnlDollars = trade.pnl_dollars != null ? parseFloat(trade.pnl_dollars) : null;
  const fees = parseFloat(trade.fees ?? '0');
  const rrActual = trade.rr_actual != null ? parseFloat(trade.rr_actual) : null;
  const entryPrice = trade.entry_price != null ? parseFloat(trade.entry_price) : null;
  const exitPrice = trade.exit_price != null ? parseFloat(trade.exit_price) : null;
  const stopLossPrice = trade.stop_loss_price != null ? parseFloat(trade.stop_loss_price) : null;
  const takeProfitPrice = trade.take_profit_price != null ? parseFloat(trade.take_profit_price) : null;

  const hasNotes = trade.setup_notes || trade.execution_notes || trade.review_notes;

  const renderStars = (rating: number) => {
    return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/trades')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Trade Log
      </button>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTop}>
            <span className={styles.symbol}>{trade.symbol}</span>
            <DirectionBadge direction={trade.direction} />
            {trade.outcome && <OutcomeBadge outcome={trade.outcome} />}
          </div>
          <span className={styles.date}>{formatDateTime(trade.trade_date)}</span>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={() => navigate(`/trades/${trade.id}/edit`)}>
            Edit
          </Button>
          {showDeleteConfirm ? (
            <div className={styles.deleteConfirm}>
              <Button
                variant="danger"
                size="sm"
                loading={deleteTrade.isPending}
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Large P&L Display */}
      <div className={styles.pnlCard}>
        <div className={styles.pnlMain}>
          <span className={styles.pnlLabel}>Net P&L</span>
          <span className={`${styles.pnlValue} ${getPnlClass(pnlNet)}`}>
            {pnlNet != null ? formatCurrency(pnlNet) : '--'}
          </span>
        </div>
        <div className={styles.pnlSecondary}>
          <div className={styles.pnlStat}>
            <span className={styles.pnlStatLabel}>Gross P&L</span>
            <span className={`${styles.pnlStatValue} ${getPnlClass(pnlDollars)}`}>
              {formatCurrency(pnlDollars)}
            </span>
          </div>
          <div className={styles.pnlStat}>
            <span className={styles.pnlStatLabel}>Fees</span>
            <span className={styles.pnlStatValue}>
              {formatCurrency(fees)}
            </span>
          </div>
          <div className={styles.pnlStat}>
            <span className={styles.pnlStatLabel}>RR</span>
            <span className={styles.pnlStatValue}>
              {formatRR(rrActual)}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className={styles.detailsGrid}>
        {/* Prices */}
        <div className={styles.detailCard}>
          <div className={styles.detailCardTitle}>Prices</div>
          <div className={styles.detailRows}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Entry Price</span>
              <span className={styles.detailValue}>
                {entryPrice != null ? entryPrice.toFixed(2) : '--'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Exit Price</span>
              <span className={styles.detailValue}>
                {exitPrice != null ? exitPrice.toFixed(2) : '--'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Stop Loss</span>
              <span className={styles.detailValue}>
                {stopLossPrice != null ? stopLossPrice.toFixed(2) : '--'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Take Profit</span>
              <span className={styles.detailValue}>
                {takeProfitPrice != null ? takeProfitPrice.toFixed(2) : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Trade Details */}
        <div className={styles.detailCard}>
          <div className={styles.detailCardTitle}>Trade Details</div>
          <div className={styles.detailRows}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>
                {['CURRENCY', 'CRYPTO'].includes(trade.asset_class ?? '') ? 'Lot Size' : 'Contracts'}
              </span>
              <span className={styles.detailValue}>{trade.contracts}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Gross P&L</span>
              <span className={`${styles.detailValue} ${getPnlClass(pnlDollars)}`}>
                {formatCurrency(pnlDollars)}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Fees</span>
              <span className={styles.detailValue}>{formatCurrency(fees)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Net P&L</span>
              <span className={`${styles.detailValue} ${getPnlClass(pnlNet)}`}>
                {pnlNet != null ? formatCurrency(pnlNet) : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className={styles.detailCard}>
          <div className={styles.detailCardTitle}>Classification</div>
          <div className={styles.detailRows}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Session</span>
              <span className={styles.detailValueText}>{trade.session || '--'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Asset Class</span>
              <span className={styles.detailValueText}>{trade.asset_class || '--'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Emotional State</span>
              <span className={styles.detailValueText}>{trade.emotional_state || '--'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Strategy</span>
              {trade.strategy_name ? (
                <span className={styles.strategyValue}>
                  <span
                    className={styles.strategyDot}
                    style={{
                      backgroundColor: '#6b7280',
                    }}
                  />
                  {trade.strategy_name}
                </span>
              ) : (
                <span className={styles.detailValueText}>--</span>
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className={styles.detailCard}>
          <div className={styles.detailCardTitle}>Meta</div>
          <div className={styles.detailRows}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Rating</span>
              {trade.rating && trade.rating > 0 ? (
                <span className={styles.ratingStars}>{renderStars(trade.rating)}</span>
              ) : (
                <span className={styles.detailValueText}>--</span>
              )}
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Followed Plan</span>
              <span
                className={`${styles.followedPlan} ${
                  trade.followed_plan ? styles.followedPlanYes : styles.followedPlanNo
                }`}
              >
                {trade.followed_plan ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Yes
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    No
                  </>
                )}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Entry Time</span>
              <span className={styles.detailValue}>{formatDateTime(trade.entry_time)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Exit Time</span>
              <span className={styles.detailValue}>{formatDateTime(trade.exit_time)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {hasNotes && (
        <div className={styles.notesSection}>
          <h2 className={styles.sectionTitle}>Notes</h2>
          <div className={styles.notesGrid}>
            {trade.setup_notes && (
              <div className={styles.noteCard}>
                <div className={styles.noteCardTitle}>Setup Notes</div>
                <div className={styles.noteCardBody}>{trade.setup_notes}</div>
              </div>
            )}
            {trade.execution_notes && (
              <div className={styles.noteCard}>
                <div className={styles.noteCardTitle}>Execution Notes</div>
                <div className={styles.noteCardBody}>{trade.execution_notes}</div>
              </div>
            )}
            {trade.review_notes && (
              <div className={styles.noteCard}>
                <div className={styles.noteCardTitle}>Review Notes</div>
                <div className={styles.noteCardBody}>{trade.review_notes}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Images */}
      {trade.images && trade.images.length > 0 && (
        <div className={styles.imagesSection}>
          <h2 className={styles.sectionTitle}>Images</h2>
          <ImageViewer images={trade.images} />
        </div>
      )}
    </div>
  );
}

export default TradeDetail;
