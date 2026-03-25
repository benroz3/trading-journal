import { type SelectHTMLAttributes, forwardRef } from 'react';
import styles from './ui.module.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className, ...rest }, ref) => {
    return (
      <div className={styles.selectWrapper}>
        {label && <label className={styles.selectLabel}>{label}</label>}
        <select
          ref={ref}
          className={`${styles.select} ${className || ''}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
