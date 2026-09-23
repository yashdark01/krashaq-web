import { cn } from '@/lib/utils';

export function Message({
  align = 'start',
  className,
  ...props
}: React.ComponentProps<'article'> & { align?: 'start' | 'end' }) {
  return (
    <article
      className={cn(
        'flex w-full gap-3',
        align === 'end' && 'justify-end',
        className,
      )}
      {...props}
    />
  );
}
export function MessageAvatar({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-primary',
        className,
      )}
      {...props}
    />
  );
}
export function MessageContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('min-w-0 max-w-[88%]', className)} {...props} />;
}
export function MessageFooter({
  className,
  ...props
}: React.ComponentProps<'footer'>) {
  return (
    <footer
      className={cn(
        'mt-1 flex min-h-8 items-center gap-1 text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
