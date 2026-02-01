"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function SubmitButton({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode
  variant?: "default" | "white"
  className?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`w-full font-bold ${
        variant === "white"
          ? "bg-white hover:bg-gray-200 text-black"
          : "bg-green-600 hover:bg-green-700 text-black"
      } ${className || ""}`} 
    >
      {pending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children
      )}
    </Button>
  )
}