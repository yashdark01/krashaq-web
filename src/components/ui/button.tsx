import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
const variants = cva('button', {
  variants: {
    variant: {
      default: 'button-primary',
      outline: 'button-outline',
      ghost: 'button-ghost',
    },
  },
  defaultVariants: { variant: 'default' },
});
export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={variants({ variant, className })} {...props} />;
}
