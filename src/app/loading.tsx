import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-green-500">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-black tracking-widest text-sm animate-pulse">ŁADOWANIE NEXTBET...</p>
      </div>
    </div>
  )
}