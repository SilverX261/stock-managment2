'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, style, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(className)}
    style={{
      display: 'inline-flex',
      height: '2.5rem',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '0.5rem',
      backgroundColor: '#F5F2EC',
      padding: '0.25rem',
      color: '#A1A1AA',
      ...style,
    }}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, style, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(className)}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      borderRadius: '0.25rem',
      padding: '0.375rem 0.75rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      transition: 'all 150ms',
      outline: 'none',
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      color: '#A1A1AA',
      ...style,
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLButtonElement
      if (el.dataset.state !== 'active') el.style.color = '#3F3F46'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLButtonElement
      if (el.dataset.state !== 'active') el.style.color = '#A1A1AA'
    }}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, style, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(className)}
    style={{ marginTop: '0.5rem', outline: 'none', ...style }}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
