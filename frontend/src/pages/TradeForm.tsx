import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrade, useTrades, useCreateTrade, useUpdateTrade } from '../hooks/useTrades';
import { useStrategies } from '../hooks/useStrategies';
import { useUploadImages, useDeleteImage } from '../hooks/useImageUpload';
import {
  SYMBOL_PRESETS,
  OUTCOME_OPTIONS,
  DIRECTION_OPTIONS,
  SESSION_OPTIONS,
  ASSET_CLASS_OPTIONS,
  EMOTIONAL_STATES,
} from '../utils/constants';
import type { TradeFormData } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ImageUpload from '../components/ImageUpload/ImageUpload';
import styles from './TradeForm.module.scss';

interface FormState {
  trade_date: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  strategy_id: string;
  contracts: number;
  entry_price: string;
  exit_price: string;
  stop_loss_price: string;
  take_profit_price: string;
  outcome: string;
  rr_planned: string;
  rr_actual: string;
  pnl_ticks: string;
  pnl_dollars: string;
  fees: string;
  pnl_net: string;
  tick_size: string;
  tick_value: string;
  session: string;
  asset_class: string;
  entry_time: string;
  exit_time: string;
  emotional_state: string;
  rating: number;
  followed_plan: boolean;
  setup_notes: string;
  execution_notes: string;
  review_notes: string;
}

const defaultForm: FormState = {
  trade_date: new Date().toISOString().slice(0, 10),
  symbol: '',
  direction: 'LONG',
  strategy_id: '',
  contracts: 1,
  entry_price: '',
  exit_price: '',
  stop_loss_price: '',
  take_profit_price: '',
  outcome: '',
  rr_planned: '',
  rr_actual: '',
  pnl_ticks: '',
  pnl_dollars: '',
  fees: '5.00',
  pnl_net: '',
  tick_size: '',
  tick_value: '',
  session: '',
  asset_class: '',
  entry_time: '',
  exit_time: '',
  emotional_state: '',
  rating: 0,
  followed_plan: false,
  setup_notes: '',
  execution_notes: '',
  review_notes: '',
};

function TradeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const tradeId = id || undefined;

  const { data: existingTrade, isLoading: tradeLoading } = useTrade(tradeId);
  const { data: tradesData } = useTrades({ limit: 500 });
  const { data: strategies } = useStrategies();

  // Build unique symbol list from past trades
  const usedSymbols = useMemo(() => {
    const set = new Set<string>();
    tradesData?.data?.forEach((t) => set.add(t.symbol));
    SYMBOL_PRESETS.forEach((p) => set.add(p.symbol));
    return Array.from(set).sort();
  }, [tradesData]);
  const createTrade = useCreateTrade();
  const updateTrade = useUpdateTrade();
  const uploadImages = useUploadImages();
  const deleteImage = useDeleteImage();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    prices: true,
    result: true,
    classification: true,
    notes: true,
    images: true,
  });

  // Pre-fill form in edit mode
  useEffect(() => {
    if (!existingTrade) return;
    const t = existingTrade;

    const preset = SYMBOL_PRESETS.find((p) => p.symbol === t.symbol);
    const tickSize = t.tick_size ?? (preset ? String(preset.tickSize) : '');
    const tickValue = t.tick_value ?? (preset ? String(preset.tickValue) : '');

    setForm({
      trade_date: t.trade_date ? t.trade_date.slice(0, 10) : '',
      symbol: t.symbol,
      direction: t.direction,
      strategy_id: t.strategy_id ? String(t.strategy_id) : '',
      contracts: t.contracts || 1,
      entry_price: t.entry_price != null ? String(t.entry_price) : '',
      exit_price: t.exit_price != null ? String(t.exit_price) : '',
      stop_loss_price: t.stop_loss_price != null ? String(t.stop_loss_price) : '',
      take_profit_price: t.take_profit_price != null ? String(t.take_profit_price) : '',
      outcome: t.outcome || '',
      rr_planned: t.rr_planned != null ? String(t.rr_planned) : '',
      rr_actual: t.rr_actual != null ? String(t.rr_actual) : '',
      pnl_ticks: t.pnl_ticks != null ? String(t.pnl_ticks) : '',
      pnl_dollars: t.pnl_dollars != null ? String(t.pnl_dollars) : '',
      fees: t.fees != null ? String(t.fees) : '5.00',
      pnl_net: t.pnl_net != null ? String(t.pnl_net) : '',
      tick_size: tickSize,
      tick_value: tickValue,
      session: t.session || '',
      asset_class: t.asset_class || '',
      entry_time: t.entry_time || '',
      exit_time: t.exit_time || '',
      emotional_state: t.emotional_state || '',
      rating: t.rating || 0,
      followed_plan: t.followed_plan || false,
      setup_notes: t.setup_notes || '',
      execution_notes: t.execution_notes || '',
      review_notes: t.review_notes || '',
    });
  }, [existingTrade]);

  // Auto-fill from symbol preset
  const handleSymbolChange = useCallback((symbol: string) => {
    const preset = SYMBOL_PRESETS.find((p) => p.symbol === symbol);
    setForm((p) => ({
      ...p,
      symbol,
      tick_size: preset ? String(preset.tickSize) : p.tick_size,
      tick_value: preset ? String(preset.tickValue) : p.tick_value,
      asset_class: preset ? preset.assetClass : p.asset_class,
    }));
  }, []);

  // Auto-compute P&L: dollars is the input, ticks are derived
  const computed = useMemo(() => {
    const tickValue = parseFloat(form.tick_value);
    const contracts = form.contracts || 1;
    const fees = parseFloat(form.fees) || 2.5 * 2 * contracts;

    // P&L dollars is the primary input
    const pnlDollars = form.pnl_dollars !== '' ? parseFloat(form.pnl_dollars) : null;

    // Derive ticks from dollars: ticks = dollars / (tickValue * contracts)
    let pnlTicks: number | null = null;
    if (pnlDollars !== null && !isNaN(pnlDollars) && !isNaN(tickValue) && tickValue !== 0 && contracts !== 0) {
      pnlTicks = pnlDollars / (tickValue * contracts);
    }
    // Allow manual override of ticks
    if (form.pnl_ticks !== '') {
      pnlTicks = parseFloat(form.pnl_ticks);
    }

    // Net = dollars - fees
    let pnlNet: number | null = null;
    if (pnlDollars !== null && !isNaN(pnlDollars)) {
      pnlNet = pnlDollars - fees;
    }

    return {
      pnlTicks: pnlTicks !== null && !isNaN(pnlTicks) ? pnlTicks : null,
      pnlDollars: pnlDollars !== null && !isNaN(pnlDollars) ? pnlDollars : null,
      fees,
      pnlNet: pnlNet !== null && !isNaN(pnlNet) ? pnlNet : null,
    };
  }, [
    form.tick_value,
    form.contracts,
    form.pnl_ticks,
    form.pnl_dollars,
    form.fees,
  ]);

  // Auto-update fees when contracts change
  useEffect(() => {
    setForm((p) => ({
      ...p,
      fees: String((2.5 * 2 * (p.contracts || 1)).toFixed(2)),
    }));
  }, [form.contracts]);

  const toggleSection = (key: string) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: TradeFormData = {
      trade_date: form.trade_date,
      symbol: form.symbol,
      direction: form.direction,
      outcome: (form.outcome as TradeFormData['outcome']) || 'BE',
      entry_time: form.entry_time || null,
      exit_time: form.exit_time || null,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      stop_loss_price: form.stop_loss_price ? parseFloat(form.stop_loss_price) : null,
      take_profit_price: form.take_profit_price ? parseFloat(form.take_profit_price) : null,
      contracts: form.contracts || 1,
      tick_size: form.tick_size ? parseFloat(form.tick_size) : null,
      tick_value: form.tick_value ? parseFloat(form.tick_value) : null,
      rr_planned: form.rr_planned ? parseFloat(form.rr_planned) : null,
      rr_actual: form.rr_actual ? parseFloat(form.rr_actual) : null,
      pnl_ticks: computed.pnlTicks ?? (form.pnl_ticks ? parseFloat(form.pnl_ticks) : null),
      pnl_dollars: computed.pnlDollars ?? (form.pnl_dollars ? parseFloat(form.pnl_dollars) : null),
      fees: parseFloat(form.fees) || 0,
      pnl_net: computed.pnlNet ?? (form.pnl_net ? parseFloat(form.pnl_net) : null),
      strategy_id: form.strategy_id || null,
      asset_class: form.asset_class || null,
      session: form.session || null,
      setup_notes: form.setup_notes.trim() || null,
      execution_notes: form.execution_notes.trim() || null,
      review_notes: form.review_notes.trim() || null,
      rating: form.rating > 0 ? form.rating : null,
      emotional_state: form.emotional_state || null,
      followed_plan: form.followed_plan,
    };

    try {
      let resultId: string;

      if (isEditing && tradeId) {
        const result = await updateTrade.mutateAsync({ id: tradeId, data: payload });
        resultId = result.id;
      } else {
        const result = await createTrade.mutateAsync(payload);
        resultId = result.id;
      }

      if (imageFiles.length > 0) {
        await uploadImages.mutateAsync({ tradeId: resultId, files: imageFiles });
      }

      navigate(`/trades/${resultId}`);
    } catch {
      // toast handled by hooks
    } finally {
      setSubmitting(false);
    }
  };

  const strategyOptions = [
    { value: '', label: 'None' },
    ...(strategies?.map((s) => ({ value: String(s.id), label: s.name })) || []),
  ];

  const emotionalOptions = [
    { value: '', label: 'Select...' },
    ...EMOTIONAL_STATES.map((e) => ({ value: e, label: e })),
  ];

  if (isEditing && tradeLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading trade...</div>
      </div>
    );
  }

  const SectionChevron = ({ open }: { open: boolean }) => (
    <span className={`${styles.sectionToggle} ${open ? styles.sectionToggleOpen : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{isEditing ? 'Edit Trade' : 'New Trade'}</h1>
          <p>{isEditing ? 'Update trade details' : 'Log a new trade'}</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Section 1: Core Trade Info */}
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('core')}>
            <h2>Core Trade Info</h2>
            <SectionChevron open={openSections.core} />
          </div>
          {openSections.core && (
            <div className={styles.sectionBody}>
              <div className={styles.fieldGrid}>
                <Input
                  label="Date"
                  type="date"
                  value={form.trade_date}
                  onChange={(e) => updateField('trade_date', e.target.value)}
                  required
                />

                <div>
                  <label className={styles.inputLabel}>Symbol</label>
                  <input
                    className={styles.textInput}
                    list="symbol-list"
                    placeholder="Type or select symbol..."
                    value={form.symbol}
                    onChange={(e) => handleSymbolChange(e.target.value.toUpperCase())}
                    required
                  />
                  <datalist id="symbol-list">
                    {usedSymbols.map((s) => {
                      const preset = SYMBOL_PRESETS.find((p) => p.symbol === s);
                      return (
                        <option key={s} value={s}>
                          {preset ? `${s} - ${preset.name}` : s}
                        </option>
                      );
                    })}
                  </datalist>
                </div>

                <div className={styles.directionGroup}>
                  <span className={styles.directionLabel}>Direction</span>
                  <div className={styles.directionButtons}>
                    {DIRECTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.directionBtn} ${
                          opt.value === 'LONG' ? styles.directionBtnLong : styles.directionBtnShort
                        } ${form.direction === opt.value ? styles.directionBtnActive : ''}`}
                        onClick={() => updateField('direction', opt.value as 'LONG' | 'SHORT')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Select
                  label="Strategy"
                  options={strategyOptions}
                  value={form.strategy_id}
                  onChange={(e) => updateField('strategy_id', e.target.value)}
                />

                <div className={styles.monoInput}>
                  <Input
                    label={['CURRENCY', 'CRYPTO'].includes(form.asset_class) ? 'Lot Size' : 'Contracts'}
                    type="number"
                    min={0.01}
                    step="any"
                    value={form.contracts}
                    onChange={(e) => updateField('contracts', Number(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Prices */}
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('prices')}>
            <h2>Prices</h2>
            <SectionChevron open={openSections.prices} />
          </div>
          {openSections.prices && (
            <div className={styles.sectionBody}>
              <div className={styles.fieldGrid}>
                <div className={styles.monoInput}>
                  <Input
                    label="Entry Price"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.entry_price}
                    onChange={(e) => updateField('entry_price', e.target.value)}
                  />
                </div>
                <div className={styles.monoInput}>
                  <Input
                    label="Exit Price"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.exit_price}
                    onChange={(e) => updateField('exit_price', e.target.value)}
                  />
                </div>
                <div className={styles.monoInput}>
                  <Input
                    label="Stop Loss"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.stop_loss_price}
                    onChange={(e) => updateField('stop_loss_price', e.target.value)}
                  />
                </div>
                <div className={styles.monoInput}>
                  <Input
                    label="Take Profit"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.take_profit_price}
                    onChange={(e) => updateField('take_profit_price', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Result */}
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('result')}>
            <h2>Result</h2>
            <SectionChevron open={openSections.result} />
          </div>
          {openSections.result && (
            <div className={styles.sectionBody}>
              <div className={styles.fieldGrid}>
                <Select
                  label="Outcome"
                  options={[{ value: '', label: 'Select...' }, ...OUTCOME_OPTIONS]}
                  value={form.outcome}
                  onChange={(e) => updateField('outcome', e.target.value)}
                />

                <div className={styles.monoInput}>
                  <Input
                    label="RR Planned"
                    type="number"
                    step="any"
                    placeholder="e.g. 2.0"
                    value={form.rr_planned}
                    onChange={(e) => updateField('rr_planned', e.target.value)}
                  />
                </div>

                <div className={styles.monoInput}>
                  <Input
                    label="RR Actual"
                    type="number"
                    step="any"
                    placeholder="e.g. 1.5"
                    value={form.rr_actual}
                    onChange={(e) => updateField('rr_actual', e.target.value)}
                  />
                </div>

                <div className={styles.monoInput}>
                  <Input
                    label="P&L (Dollars)"
                    type="number"
                    step="any"
                    placeholder="Enter P&L in $"
                    value={form.pnl_dollars}
                    onChange={(e) => updateField('pnl_dollars', e.target.value)}
                  />
                </div>

                <div className={styles.computedField}>
                  <span className={styles.computedLabel}>P&L (Ticks)</span>
                  <div className={styles.computedValue}>
                    {computed.pnlTicks !== null
                      ? computed.pnlTicks.toFixed(2)
                      : form.pnl_ticks
                        ? parseFloat(form.pnl_ticks).toFixed(2)
                        : '--'}
                  </div>
                </div>

                <div className={styles.monoInput}>
                  <Input
                    label="Fees"
                    type="number"
                    step="0.01"
                    value={form.fees}
                    onChange={(e) => updateField('fees', e.target.value)}
                  />
                </div>

                <div className={styles.computedField}>
                  <span className={styles.computedLabel}>Net P&L</span>
                  <div
                    className={`${styles.computedValue} ${
                      (computed.pnlNet ?? 0) > 0
                        ? styles.computedPositive
                        : (computed.pnlNet ?? 0) < 0
                          ? styles.computedNegative
                          : ''
                    }`}
                  >
                    {computed.pnlNet !== null ? `$${computed.pnlNet.toFixed(2)}` : '--'}
                  </div>
                </div>

                <div className={styles.monoInput}>
                  <Input
                    label="Tick Size"
                    type="number"
                    step="any"
                    value={form.tick_size}
                    onChange={(e) => updateField('tick_size', e.target.value)}
                  />
                </div>

                <div className={styles.monoInput}>
                  <Input
                    label="Tick Value ($)"
                    type="number"
                    step="any"
                    value={form.tick_value}
                    onChange={(e) => updateField('tick_value', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Classification */}
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('classification')}>
            <h2>Classification</h2>
            <SectionChevron open={openSections.classification} />
          </div>
          {openSections.classification && (
            <div className={styles.sectionBody}>
              <div className={styles.fieldGrid}>
                <Select
                  label="Session"
                  options={[{ value: '', label: 'Select...' }, ...SESSION_OPTIONS]}
                  value={form.session}
                  onChange={(e) => updateField('session', e.target.value)}
                />

                <Select
                  label="Asset Class"
                  options={[{ value: '', label: 'Select...' }, ...ASSET_CLASS_OPTIONS]}
                  value={form.asset_class}
                  onChange={(e) => updateField('asset_class', e.target.value)}
                />

                <Input
                  label="Entry Time"
                  type="datetime-local"
                  value={form.entry_time}
                  onChange={(e) => updateField('entry_time', e.target.value)}
                />

                <Input
                  label="Exit Time"
                  type="datetime-local"
                  value={form.exit_time}
                  onChange={(e) => updateField('exit_time', e.target.value)}
                />

                <Select
                  label="Emotional State"
                  options={emotionalOptions}
                  value={form.emotional_state}
                  onChange={(e) => updateField('emotional_state', e.target.value)}
                />

                <div className={styles.starGroup}>
                  <span className={styles.starLabel}>Rating</span>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`${styles.star} ${star <= form.rating ? styles.starActive : ''}`}
                        onClick={() => updateField('rating', star === form.rating ? 0 : star)}
                      >
                        <svg viewBox="0 0 24 24" fill={star <= form.rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.checkboxGroup}>
                  <span className={styles.checkboxLabel}>Followed Plan</span>
                  <div
                    className={styles.toggle}
                    onClick={() => updateField('followed_plan', !form.followed_plan)}
                  >
                    <div
                      className={`${styles.toggleTrack} ${
                        form.followed_plan ? styles.toggleTrackActive : ''
                      }`}
                    >
                      <div
                        className={`${styles.toggleThumb} ${
                          form.followed_plan ? styles.toggleThumbActive : ''
                        }`}
                      />
                    </div>
                    <span className={styles.toggleText}>
                      {form.followed_plan ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Notes */}
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('notes')}>
            <h2>Notes</h2>
            <SectionChevron open={openSections.notes} />
          </div>
          {openSections.notes && (
            <div className={styles.sectionBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.textareaWrapper}>
                  <label className={styles.textareaLabel}>Setup Notes (Pre-trade thesis)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="What was your thesis for entering this trade?"
                    value={form.setup_notes}
                    onChange={(e) => updateField('setup_notes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.textareaWrapper}>
                  <label className={styles.textareaLabel}>Execution Notes</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="How did you execute the trade?"
                    value={form.execution_notes}
                    onChange={(e) => updateField('execution_notes', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.textareaWrapper}>
                  <label className={styles.textareaLabel}>Review Notes (Post-trade reflection)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="What did you learn from this trade?"
                    value={form.review_notes}
                    onChange={(e) => updateField('review_notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Images */}
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => toggleSection('images')}>
            <h2>Images</h2>
            <SectionChevron open={openSections.images} />
          </div>
          {openSections.images && (
            <div className={styles.sectionBody}>
              <ImageUpload
                files={imageFiles}
                onFilesChange={setImageFiles}
                existingImages={existingTrade?.images}
                onDeleteExisting={(imgId) => deleteImage.mutate(imgId)}
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <div className={styles.formFooter}>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditing ? 'Update Trade' : 'Create Trade'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TradeForm;
