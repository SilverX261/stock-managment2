import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => (
    <textarea
      className={cn('fc-input', className)}
      ref={ref}
      style={{
        display: 'flex',
        minHeight: '80px',
        width: '100%',
        borderRadius: '0.5rem',
        border: '1px solid #E4E2DC',
        backgroundColor: '#FFFFFF',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        outline: 'none',
        resize: 'vertical',
        transition: 'border-color 150ms, box-shadow 150ms',
        ...style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = '#F97316'
        e.currentTarget.style.boxShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #F97316'
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = '#E4E2DC'
        e.currentTarget.style.boxShadow = 'none'
      }}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }
