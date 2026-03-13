import { BookingStatus, STATUS_COLORS } from '../../types';

interface Props {
  status: BookingStatus;
  className?: string;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export function StatusBadge({ status, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
