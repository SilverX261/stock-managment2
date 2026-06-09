import * as React from 'react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ style, disabled, ...props }, ref) => (
    <input
      ref={ref}
      disabled={disabled}
      style={{
        display:         'flex',
        width:           '100%',
        height:          '40px',
        padding:         '0 12px',
        borderRadius:    '8px',
        border:          '1px solid #E4E2DC',
        backgroundColor: disabled ? '#F5F2EC' : '#FFFFFF',
        fontSize:        '14px',
        color:           '#0A0A0A',
        outline:         'none',
        transition:      'border-color 150ms, box-shadow 150ms',
        cursor:          disabled ? 'not-allowed' : 'text',
        opacity:         disabled ? 0.6 : 1,
        ...style,
      }}
      onFocus={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = '#F97316'
          e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(249,115,22,0.12)'
        }
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = (style?.borderColor as string) ?? '#E4E2DC'
        e.currentTarget.style.boxShadow   = 'none'
      }}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export { Input }
