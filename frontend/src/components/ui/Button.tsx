import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './ui.module.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantMap: Record<string, string> = {
  primary: styles.btnPrimary,
  success: styles.btnSuccess,
  danger: styles.btnDanger,
  ghost: styles.btnGhost,
};

const sizeMap: Record<string, string> = {
  sm: styles.btnSm,
  md: styles.btnMd,
  lg: styles.btnLg,
};

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    variantMap[variant],
    sizeMap[size],
    loading ? styles.btnLoading : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {children}
    </button>
  );
}

export default Button;
