'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  url: string
  message: string
}

export function ShareButton({ url, message }: Props) {
  const [copied, setCopied] = useState(false)

  function shareWhatsApp() {
    const text = encodeURIComponent(`${message}${url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={shareWhatsApp}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
      >
        <Share2 size={14} />
        Convidar pelo WhatsApp
      </button>
      <button
        onClick={copyLink}
        className="flex items-center gap-2 btn-secondary text-sm px-4 py-2"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        {copied ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  )
}
