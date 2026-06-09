'use client'

import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ orientation = 'horizontal', decorative = true, style, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    style={{
      flexShrink: 0,
      backgroundColor: '#F0EEE8',
      ...(orientation === 'horizontal'
        ? { height: '1px', width: '100%' }
        : { height: '100%', width: '1px' }),
      ...style,
    }}
    {...props}
  />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
