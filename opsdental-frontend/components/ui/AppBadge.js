import { BADGE_VARIANT, PLAN_LABEL } from '@/lib/constants';

export default function AppBadge({ text, variant }) {
  const key   = text?.toLowerCase();
  const color = variant || BADGE_VARIANT[key] || 'secondary';
  const label = PLAN_LABEL[key] ?? text;
  return (
    <span className={`badge bg-${color}`}>{label}</span>
  );
}
