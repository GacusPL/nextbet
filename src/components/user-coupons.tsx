'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cashoutCoupon } from '@/app/dashboard/actions'
import { Ticket, History, CheckCircle, XCircle } from 'lucide-react'
import { useState } from "react"
import { Separator } from "@/components/ui/separator"

export default function UserCouponsList({ coupons, showHistory = true }: { coupons: any[], showHistory?: boolean }) {
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const activeCoupons = coupons.filter(c => c.status === 'OPEN')
  const historyCoupons = coupons.filter(c => c.status !== 'OPEN')

  const handleCashout = async (couponId: number) => {
    if (!confirm('Cashout 90%? Decyzja ostateczna.')) return
    setLoadingId(couponId)
    const result = await cashoutCoupon(couponId)
    setLoadingId(null)
    if (result.error) alert(result.error)
    else alert(result.success)
  }

  const renderCoupon = (coupon: any, isActive: boolean) => (
    <div key={coupon.id} className={`p-4 rounded border ${isActive ? 'bg-zinc-900 border-green-900/50' : 'bg-black border-zinc-800 opacity-70 hover:opacity-100 transition'}`}>
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
                <Badge className={
                    coupon.status === 'WON' ? 'bg-green-600' :
                    coupon.status === 'LOST' ? 'bg-red-600' :
                    coupon.status === 'OPEN' ? 'bg-yellow-500 text-black' : 'bg-zinc-600'
                }>{coupon.status}</Badge>
                <span className="text-xs text-gray-500">{new Date(coupon.created_at).toLocaleString()}</span>
            </div>
            {isActive && (
                <Button 
                    size="sm" variant="outline" 
                    className="h-7 text-xs border-yellow-600 text-yellow-500 hover:bg-yellow-900/20"
                    onClick={() => handleCashout(coupon.id)}
                    disabled={loadingId === coupon.id}
                >
                    {loadingId === coupon.id ? '...' : `Cashout ${Math.floor(coupon.stake * 0.9)}`}
                </Button>
            )}
        </div>

        <ul className="space-y-2 mb-3">
            {coupon.coupon_selections?.map((sel: any, idx: number) => (
                <li key={idx} className="flex justify-between text-sm items-center">
                    <span className="text-gray-300 truncate max-w-[200px]">{sel.matches?.game_name}: {sel.matches?.team_a} vs {sel.matches?.team_b}</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-green-500">Typ: {sel.prediction}</span>
                        {isActive && sel.status === 'WON' && <CheckCircle className="w-3 h-3 text-green-500"/>}
                        {isActive && sel.status === 'LOST' && <XCircle className="w-3 h-3 text-red-500"/>}
                    </div>
                </li>
            ))}
        </ul>

        <Separator className="bg-zinc-800/50 my-2" />
        <div className="flex justify-between text-sm">
            <span className="text-gray-500">Stawka: <span className="text-white">{coupon.stake}</span></span>
            <span className="text-gray-500">Wygrana: <span className={`font-bold ${coupon.status === 'WON' ? 'text-green-400' : 'text-white'}`}>{coupon.potential_win}</span></span>
        </div>
    </div>
  )

 return (
    <div className="space-y-8 mt-8">
      
      {/* AKTYWNE */}
      <Card className="bg-zinc-950 border-green-900/30">
        <CardHeader>
          <CardTitle className="text-green-500 flex gap-2">
            <Ticket /> W GRZE ({activeCoupons.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeCoupons.length > 0 ? activeCoupons.map(c => renderCoupon(c, true)) : <p className="text-zinc-600 text-sm">Brak aktywnych kuponów.</p>}
        </CardContent>
      </Card>

      {/* HISTORIA - tylko jeśli showHistory = true */}
      {showHistory && (
        <Card className="bg-black border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-500 flex gap-2">
              <History /> HISTORIA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {historyCoupons.length > 0 ? historyCoupons.map(c => renderCoupon(c, false)) : <p className="text-zinc-600 text-sm">Brak kuponów w historii.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}