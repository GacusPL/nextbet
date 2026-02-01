"use client"

import { toast } from "sonner"

export default function ForgotPasswordTrigger() {
  const handleClick = () => {
    toast.error("Napisz do admina", {
      duration: 4000,
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-green-500 hover:text-green-400 hover:underline bg-transparent border-none p-0 cursor-pointer transition-colors"
    >
      Zapomniałeś hasła?
    </button>
  )
}