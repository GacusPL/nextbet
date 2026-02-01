import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Shield, Coins, History, Trophy, TrendingUp, AlertCircle, Settings, Calendar } from 'lucide-react'
import UserCouponsList from '@/components/user-coupons'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import ProfileForm from '@/components/profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: myCoupons } = await supabase
    .from('coupons')
    .select(`
        *,
        coupon_selections (
            prediction,
            matches (game_name, team_a, team_b)
        )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // --- OBLICZENIA STATYSTYK ---
  const totalCoupons = myCoupons?.length || 0
  const wonCoupons = myCoupons?.filter(c => c.status === 'WON').length || 0
  const lostCoupons = myCoupons?.filter(c => c.status === 'LOST').length || 0
  const openCoupons = myCoupons?.filter(c => c.status === 'OPEN').length || 0
  
  const settledCoupons = wonCoupons + lostCoupons
  const winRate = settledCoupons > 0 ? Math.round((wonCoupons / settledCoupons) * 100) : 0

  const totalStaked = myCoupons?.reduce((acc, curr) => acc + curr.stake, 0) || 0
  const totalWon = myCoupons?.filter(c => c.status === 'WON').reduce((acc, curr) => acc + curr.potential_win, 0) || 0
  const netProfit = totalWon - totalStaked

  const joinDate = new Date(user.created_at).getFullYear()

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER NAWIGACYJNY */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-zinc-800 pb-8">
            <Link href="/dashboard">
            <Button
              variant="ghost"
              className="
                text-zinc-400
                hover:text-white
                hover:bg-zinc-800/70
                pl-0
                text-lg
                group
              "
            >
              <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Powrót do gry
            </Button>
            </Link>
            <div className="flex items-center gap-4">
                 {profile?.is_admin && <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10 px-4 py-1 text-sm font-bold"><Shield className="w-4 h-4 mr-2"/> ADMIN</Badge>}
                 <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/10 px-4 py-1 text-sm font-bold"><Coins className="w-4 h-4 mr-2"/> {profile?.points} REX</Badge>
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
            
            {/* LEWA STRONA: WIZYTÓWKA */}
            <div className="lg:col-span-1 space-y-8">
                <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative group shadow-2xl">
                    
                    {/* PRZYCISK EDYCJI (MODAL) */}
                    <div className="absolute top-4 right-4 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full" title="Ustawienia profilu">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Edycja Profilu</DialogTitle>
                                    <DialogDescription>Zmień swój nick lub hasło.</DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                    <ProfileForm initialUsername={profile?.username || ''} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-950 mb-6 shadow-xl relative">
                            <User className="w-16 h-16 text-green-600" />
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-zinc-900" title="Online"></div>
                        </div>
                        
                        <h1 className="text-3xl font-black text-white tracking-tight break-all mb-2">{profile?.username}</h1>
                        <p className="text-zinc-500 text-sm font-mono">{user.email}</p>
                        
                        <div className="flex items-center gap-2 mt-6 text-sm text-zinc-400 bg-black/40 px-4 py-2 rounded-full border border-zinc-800">
                            <Calendar className="w-4 h-4" />
                            <span>W grze od {joinDate}</span>
                        </div>
                    </CardContent>

                    {/* MINI STATYSTYKI WIZYTÓWKI */}
                    <div className="grid grid-cols-3 border-t border-zinc-800 bg-black/20 divide-x divide-zinc-800">
                        <div className="p-4 text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Kupony</p>
                            <p className="text-xl font-bold text-white">{totalCoupons}</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Wygrane</p>
                            <p className="text-xl font-bold text-green-500">{wonCoupons}</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Winrate</p>
                            <p className="text-xl font-bold text-yellow-500">{winRate}%</p>
                        </div>
                    </div>
                </Card>

                {/* ROZSZERZONE STATYSTYKI ("MIĘSO") */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-6 space-y-6">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-2">Statystyki Gracza</h3>
                        
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-900/20 rounded-lg border border-green-900/50 text-green-500"><Trophy className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-xs text-zinc-400 uppercase">Całkowity Zysk</p>
                                    <p className={`text-lg font-bold font-mono ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {netProfit > 0 ? '+' : ''}{netProfit} PKT
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-900/50 text-blue-500"><TrendingUp className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-xs text-zinc-400 uppercase">Obrót (Stawki)</p>
                                    <p className="text-lg font-bold font-mono text-white">{totalStaked} REX</p>
                                </div>
                            </div>
                        </div>

                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-900/50 text-yellow-500"><AlertCircle className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-xs text-zinc-400 uppercase">W grze (Otwarte)</p>
                                    <p className="text-lg font-bold font-mono text-white">{openCoupons}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* PRAWA STRONA: HISTORIA ZAKŁADÓW */}
            <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-8 p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                    <History className="w-6 h-6 text-zinc-400"/>
                    <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-300">Pełna Historia Gry</h2>
                </div>
                
                {/* Komponent listy kuponów */}
                <UserCouponsList coupons={myCoupons || []} />
            </div>

        </div>
      </div>
    </div>
  )
}