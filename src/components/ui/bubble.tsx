import { cn } from '@/lib/utils';

export function Bubble({
  variant = 'assistant',
  className,
  ...props
}: React.ComponentProps<'div'> & { variant?: 'assistant' | 'user' }) {
  return (
    <div
      className={cn(
        variant === 'user'
          ? 'rounded-2xl rounded-br-md bg-secondary px-4 py-3'
          : 'py-1',
        className,
      )}
      {...props}
    />
  );
}
export function BubbleContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'chat-markdown text-[15px] leading-7 text-foreground',
        className,
      )}
      {...props}
    />
  );
}
