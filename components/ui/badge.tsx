import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  default:     { backgroundColor: '#F97316', color: '#FFFFFF',  border: '1px solid transparent' },
  secondary:   { backgroundColor: '#FAFAF8', color: '#3F3F46',  border: '1px solid #F0EEE8' },
  destructive: { backgroundColor: '#FEE2E2', color: '#B91C1C',  border: '1px solid transparent' },
  outline:     { backgroundColor: 'transparent', color: '#3F3F46', border: '1px solid #E4E2DC' },
  success:     { backgroundColor: '#D1FAE5', color: '#047857',  border: '1px solid transparent' },
  warning:     { backgroundColor: '#FEF3C7', color: '#B45309',  border: '1px solid transparent' },
  info:        { backgroundColor: '#CCFBF1', color: '#0F766E',  border: '1px solid transparent' },
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

function Badge({ className, variant = 'default', style, ...props }: BadgeProps) {
  return (
    <div
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        padding: '0.125rem 0.625rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        transition: 'colors 150ms',
        ...VARIANT_STYLES[variant],
        ...style,
      }}
      {...props}
    />
  )
}

export { Badge }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function badgeVariants(_opts?: { variant?: Variant }) { return '' }
