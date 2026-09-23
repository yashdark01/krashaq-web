import { cn } from '@/lib/utils';

export function Marker({
  variant = 'default',
  className,
  ...props
}: React.ComponentProps<'div'> & {
  variant?: 'default' | 'border' | 'separator';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        variant === 'border' && 'border-b border-border pb-3',
        variant === 'separator' &&
          'my-2 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border',
        className,
      )}
      {...props}
    />
  );
}
export function MarkerIcon({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      className={cn('text-primary', className)}
      {...props}
    />
  );
}
export function MarkerContent({
  shimmer = false,
  className,
  ...props
}: React.ComponentProps<'span'> & { shimmer?: boolean }) {
  return (
    <span className={cn(shimmer && 'chat-shimmer', className)} {...props} />
  );
}
