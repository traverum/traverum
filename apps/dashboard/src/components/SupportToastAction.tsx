import { Link } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';
import { SUPPORT_PATH, SUPPORT_CTA } from '@/lib/support';

/** Use as the `action` prop on useToast() for error toasts so users can open the support page. */
export function SupportToastAction() {
  return (
    <ToastAction asChild altText={SUPPORT_CTA}>
      <Link to={SUPPORT_PATH}>{SUPPORT_CTA}</Link>
    </ToastAction>
  );
}
