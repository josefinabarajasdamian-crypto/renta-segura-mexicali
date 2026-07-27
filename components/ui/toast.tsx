'use client'

import { useCallback, useEffect, useState } from 'react'
import { CircleCheck } from 'lucide-react'

export function useToast(duration = 3000) {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(msg)
  }, [])

  const dismiss = useCallback(() => setMessage(null), [])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), duration)
    return () => clearTimeout(timer)
  }, [message, duration])

  return { message, show, dismiss }
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-6">
      <div className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-center text-sm font-medium text-background shadow-lg">
        <CircleCheck className="size-4 shrink-0 text-accent" />
        {message}
      </div>
    </div>
  )
}
