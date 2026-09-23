import { cn } from '@/lib/utils';

export function Textarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-12 w-full resize-none border-0 bg-transparent px-1 py-2 text-[15px] outline-none placeholder:text-muted-foreground focus:ring-0',
        className,
      )}
      {...props}
    />
  );
}
