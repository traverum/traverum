import { Badge } from '@/components/ui/badge';

interface PayoutStatusBadgeProps {
  status: string;
}

export function PayoutStatusBadge({ status }: PayoutStatusBadgeProps) {
  const isPaid = status === 'paid';

  return (
    <Badge
      variant={isPaid ? 'default' : 'secondary'}
      className={isPaid ? 'bg-success text-xs' : 'text-xs'}
    >
      {isPaid ? 'Paid' : 'Pending'}
    </Badge>
  );
}
