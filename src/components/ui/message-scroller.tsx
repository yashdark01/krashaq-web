'use client';

import { ArrowDown } from 'lucide-react';
import {
  MessageScroller as Primitive,
  useMessageScrollerScrollable,
} from '@shadcn/react/message-scroller';
import { cn } from '@/lib/utils';

export const MessageScrollerProvider = Primitive.Provider;

export function MessageScroller({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn('relative min-h-0 flex-1', className)}
      {...props}
    />
  );
}

export function MessageScrollerViewport({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Viewport>) {
  return (
    <Primitive.Viewport
      className={cn('h-full overflow-y-auto overscroll-contain', className)}
      {...props}
    />
  );
}

export function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      className={cn(
        'mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-8 md:px-8',
        className,
      )}
      {...props}
    />
  );
}

export function MessageScrollerItem({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn(
        'animate-in fade-in slide-in-from-bottom-1 duration-150',
        className,
      )}
      {...props}
    />
  );
}

export function MessageScrollerJumpToLatest() {
  const scrollable = useMessageScrollerScrollable();
  if (!scrollable.end) return null;
  return (
    <Primitive.Button
      direction="end"
      aria-label="Jump to latest message"
      className="absolute bottom-4 left-1/2 z-10 grid size-9 -translate-x-1/2 place-items-center rounded-full border border-border bg-white text-foreground shadow-md transition hover:bg-secondary"
    >
      <ArrowDown size={16} />
    </Primitive.Button>
  );
}
