"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

export default function FormFeedback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toastShownRef = useRef(false)

  useEffect(() => {
    const status = searchParams.get("status")
    const message = searchParams.get("message")
    const type = searchParams.get("type")

    if (!status || !message || toastShownRef.current) return

    const decodedMessage = decodeURIComponent(message)

    const toastOptions = {
      duration: 4000,
    }

    if (status === "error") {
      toast.error(decodedMessage, toastOptions)
    } else if (status === "warning") {
      toast.warning(decodedMessage, toastOptions)
    } else if (status === "success") {
      toast.success(decodedMessage, toastOptions)
    }

    toastShownRef.current = true

    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete("status")
    newParams.delete("message")
    newParams.delete("type")
    
    router.replace(`/login?${newParams.toString()}`)

  }, [searchParams, router])

  return null
}