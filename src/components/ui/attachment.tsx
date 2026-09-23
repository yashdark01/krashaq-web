import { cn } from '@/lib/utils';

export function Attachment({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-white',
        className,
      )}
      {...props}
    />
  );
}
export function AttachmentPreview({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('size-20 overflow-hidden bg-secondary', className)}
      {...props}
    />
  );
}
