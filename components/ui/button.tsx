import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type Size    = 'default' | 'sm' | 'lg' | 'icon'

const BASE: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            '6px',
  borderRadius:   '8px',
  fontWeight:     600,
  cursor:         'pointer',
  whiteSpace:     'nowrap',
  transition:     'background-color 120ms, box-shadow 120ms, transform 80ms',
  outline:        'none',
  border:         '1px solid transparent',
  userSelect:     'none',
  textDecoration: 'none',
}
const VARIANTS: Record<Variant, React.CSSProperties> = {
  default:     { backgroundColor: '#F97316', color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,0.22)' },
  destructive: { backgroundColor: '#EF4444', color: '#fff' },
  outline:     { backgroundColor: '#fff',    color: '#3F3F46', border: '1px solid #E4E2DC' },
  secondary:   { backgroundColor: '#FFF7ED', color: '#F97316', border: '1px solid #FFEDD5' },
  ghost:       { backgroundColor: 'transparent', color: '#3F3F46' },
  link:        { backgroundColor: 'transparent', color: '#F97316', textDecoration: 'underline', textUnderlineOffset: '3px' },
}
const SIZES: Record<Size, React.CSSProperties> = {
  default: { height: '36px', padding: '0 16px', fontSize: '13px' },
  sm:      { height: '30px', padding: '0 10px', fontSize: '12px' },
  lg:      { height: '44px', padding: '0 22px', fontSize: '15px' },
  icon:    { height: '32px', width: '32px',     padding: '0',     fontSize: '13px' },
}
const HOVER: Record<Variant, Partial<React.CSSProperties>> = {
  default:     { backgroundColor: '#EA580C', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' },
  destructive: { backgroundColor: '#DC2626' },
  outline:     { backgroundColor: '#FAFAF8', borderColor: 'rgba(249,115,22,0.4)', color: '#F97316' },
  secondary:   { backgroundColor: '#FFEDD5' },
  ghost:       { backgroundColor: '#FAFAF8', color: '#F97316' },
  link:        {},
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', asChild = false, style, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const merged: React.CSSProperties = {
      ...BASE,
      ...VARIANTS[variant],
      ...SIZES[size],
      ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}),
      ...style,
    }
    return (
      <Comp
        ref={ref}
        disabled={disabled}
        style={merged}
        onMouseEnter={e => { if (!disabled) Object.assign((e.currentTarget as HTMLElement).style, HOVER[variant]) }}
        onMouseLeave={e => { Object.assign((e.currentTarget as HTMLElement).style, { ...VARIANTS[variant], ...style }) }}
        onMouseDown={e  => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)' }}
        onMouseUp={e    => { (e.currentTarget as HTMLElement).style.transform = '' }}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buttonVariants(_opts?: { variant?: Variant; size?: Size }) { return '' }
export { Button }
