import styles from './ui.module.scss';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'purple' | 'blue';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
}

const variantMap: Record<string, string> = {
  green: styles.badgeGreen,
  red: styles.badgeRed,
  yellow: styles.badgeYellow,
  purple: styles.badgePurple,
  blue: styles.badgeBlue,
};

const outcomeVariants: Record<string, BadgeVariant> = {
  TP: 'green',
  SL: 'red',
  BE: 'yellow',
  PARTIAL: 'purple',
};

const directionVariants: Record<string, BadgeVariant> = {
  LONG: 'green',
  SHORT: 'red',
};

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const variant = outcomeVariants[outcome] || 'blue';
  return <Badge variant={variant}>{outcome}</Badge>;
}

export function DirectionBadge({ direction }: { direction: string }) {
  const variant = directionVariants[direction] || 'blue';
  return <Badge variant={variant}>{direction}</Badge>;
}

function Badge({ children, variant = 'blue' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${variantMap[variant]}`}>
      {children}
    </span>
  );
}

export default Badge;
