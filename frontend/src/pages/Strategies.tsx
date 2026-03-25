import { useState } from 'react';
import {
  useStrategies,
  useCreateStrategy,
  useUpdateStrategy,
  useDeleteStrategy,
} from '../hooks/useStrategies';
import type { Strategy } from '../types';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Strategies.module.scss';

const PRESET_COLORS = [
  '#3b82f6',
  '#10b981',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#6366f1',
];

interface StrategyFormState {
  name: string;
  description: string;
  color: string;
}

const emptyForm: StrategyFormState = {
  name: '',
  description: '',
  color: PRESET_COLORS[0],
};

function Strategies() {
  const { data: strategies, isLoading } = useStrategies();
  const createStrategy = useCreateStrategy();
  const updateStrategy = useUpdateStrategy();
  const deleteStrategy = useDeleteStrategy();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StrategyFormState>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (strategy: Strategy) => {
    setEditingId(strategy.id);
    setForm({
      name: strategy.name,
      description: strategy.description || '',
      color: strategy.color || PRESET_COLORS[0],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      color: form.color,
    };

    try {
      if (editingId) {
        await updateStrategy.mutateAsync({ id: editingId, data: payload });
      } else {
        await createStrategy.mutateAsync(payload);
      }
      closeModal();
    } catch {
      // toast handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStrategy.mutateAsync(id);
      setDeleteConfirm(null);
    } catch {
      // toast handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>Strategies</h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Strategies</h1>
          <p>Manage your trading strategies</p>
        </div>
        <Button onClick={openCreate}>+ Add Strategy</Button>
      </div>

      {!strategies || strategies.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className={styles.emptyTitle}>No Strategies Yet</div>
          <div className={styles.emptyText}>
            Create your first trading strategy to categorize and analyze your trades.
          </div>
          <Button onClick={openCreate}>+ Add Strategy</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {strategies.map((strategy) => (
            <div key={strategy.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: strategy.color || '#6b7280' }}
                />
                <span className={styles.cardName}>{strategy.name}</span>
              </div>
              {strategy.description && (
                <div className={styles.cardDesc}>{strategy.description}</div>
              )}
              <div className={styles.cardActions}>
                <Button size="sm" variant="ghost" onClick={() => openEdit(strategy)}>
                  Edit
                </Button>
                {deleteConfirm === strategy.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={deleteStrategy.isPending}
                      onClick={() => handleDelete(strategy.id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm(strategy.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingId ? 'Edit Strategy' : 'New Strategy'}
          onClose={closeModal}
        >
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              label="Name"
              placeholder="e.g. Breakout, Mean Reversion..."
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              autoFocus
            />

            <div className={styles.textareaWrapper}>
              <label className={styles.textareaLabel}>Description</label>
              <textarea
                className={styles.textarea}
                placeholder="Describe your strategy..."
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className={styles.colorPicker}>
              <span className={styles.colorLabel}>Color</span>
              <div className={styles.colorSwatches}>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorSwatch} ${
                      form.color === color ? styles.colorSwatchActive : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm((p) => ({ ...p, color }))}
                  />
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <Button variant="ghost" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createStrategy.isPending || updateStrategy.isPending}
              >
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Strategies;
