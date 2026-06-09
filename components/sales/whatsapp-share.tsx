'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildWhatsAppMessage, toWaNumber } from './types'
import type { SaleFull } from './types'

interface Props {
  sale: SaleFull
  size?: 'sm' | 'default'
  variant?: 'default' | 'outline' | 'ghost'
  label?: string
}

export function WhatsAppShare({ sale, size = 'default', variant = 'outline', label }: Props) {
  function handleShare() {
    const message = buildWhatsAppMessage(sale)
    const encoded = encodeURIComponent(message)
    const phone = toWaNumber(sale.customer?.phone ?? null)
    const url = phone
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleShare}
      className="gap-1.5 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]"
    >
      <MessageCircle className="w-4 h-4" />
      {label ?? 'WhatsApp'}
    </Button>
  )
}
