import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof LoaderCircle>) {
  return <LoaderCircle className={cn('animate-spin', className)} {...props} />;
}
