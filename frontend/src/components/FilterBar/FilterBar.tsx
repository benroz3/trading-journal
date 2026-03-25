import { useState } from 'react';
import { useStrategies } from '../../hooks/useStrategies';
import { SYMBOL_PRESETS, OUTCOME_OPTIONS } from '../../utils/constants';
import type { TradeFilters } from '../../types';
import Button from '../ui/Button';
import styles from './FilterBar.module.scss';

interface FilterBarProps {
  filters: TradeFilters;
  onApply: (filters: TradeFilters) => void;
}

function FilterBar({ filters, onApply }: FilterBarProps) {
  const { data: strategies } = useStrategies();
  const [local, setLocal] = useState<TradeFilters>({
    from: filters.from || '',
    to: filters.to || '',
    symbol: filters.symbol || '',
    outcome: filters.outcome || '',
    strategy_id: filters.strategy_id || undefined,
  });

  const handleApply = () => {
    const cleaned: TradeFilters = {};
    if (local.from) cleaned.from = local.from;
    if (local.to) cleaned.to = local.to;
    if (local.symbol) cleaned.symbol = local.symbol;
    if (local.outcome) cleaned.outcome = local.outcome;
    if (local.strategy_id) cleaned.strategy_id = local.strategy_id;
    onApply(cleaned);
  };

  const handleReset = () => {
    setLocal({ from: '', to: '', symbol: '', outcome: '', strategy_id: undefined });
    onApply({});
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>From</span>
        <input
          type="date"
          className={styles.filterInput}
          value={local.from || ''}
          onChange={(e) => setLocal((p) => ({ ...p, from: e.target.value }))}
        />
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>To</span>
        <input
          type="date"
          className={styles.filterInput}
          value={local.to || ''}
          onChange={(e) => setLocal((p) => ({ ...p, to: e.target.value }))}
        />
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Symbol</span>
        <select
          className={styles.filterSelect}
          value={local.symbol || ''}
          onChange={(e) => setLocal((p) => ({ ...p, symbol: e.target.value }))}
        >
          <option value="">All</option>
          {SYMBOL_PRESETS.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Outcome</span>
        <select
          className={styles.filterSelect}
          value={local.outcome || ''}
          onChange={(e) => setLocal((p) => ({ ...p, outcome: e.target.value }))}
        >
          <option value="">All</option>
          {OUTCOME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Strategy</span>
        <select
          className={styles.filterSelect}
          value={local.strategy_id || ''}
          onChange={(e) =>
            setLocal((p) => ({
              ...p,
              strategy_id: e.target.value || undefined,
            }))
          }
        >
          <option value="">All</option>
          {strategies?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterActions}>
        <Button size="sm" onClick={handleApply}>
          Apply
        </Button>
        <Button size="sm" variant="ghost" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export default FilterBar;
