'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { placeCoupon } from '@/app/dashboard/actions'
import { Zap, Trash2, Ticket, History, Calendar } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type Match = {
  id: number
  game_name: string
  team_a: string
  team_b: string
  odds_a: number
  odds_b: number
  status: string
  start_time: string
  winner?: string | null
  handicap?: string | null
}

type Tournament = {
  id: number
  name: string
  matches: Match[]
}

type Selection = {
  matchId: number
  gameName: string
  prediction: 'A' | 'B'
  teamName: string
  odds: number
}

export default function BettingSystem({ initialTournaments, userPoints }: { initialTournaments: any[], userPoints: number }) {
  const [coupon, setCoupon] = useState<Selection[]>([])
  const [stake, setStake] = useState<number>(100)
  const [loading, setLoading] = useState(false)
  
  // Logika dla szybkich stawek (dodana)
  const handleQuickBet = (amount: number) => {
    setStake((prev) => prev + amount)
  }

  const handleMaxBet = () => {
    setStake(userPoints)
  }

  const toggleSelection = (match: Match, prediction: 'A' | 'B') => {
    // 1. BLOKADA: Nie pozwól obstawić zakończonych/anulowanych
    if (match.status !== 'PENDING' && match.status !== 'LIVE') return

    const existingIndex = coupon.findIndex(s => s.matchId === match.id)
    
    if (existingIndex >= 0 && coupon[existingIndex].prediction === prediction) {
      setCoupon(coupon.filter((_, i) => i !== existingIndex))
      return
    }

    const newSelection: Selection = {
      matchId: match.id,
      gameName: match.game_name,
      prediction,
      teamName: prediction === 'A' ? match.team_a : match.team_b,
      odds: prediction === 'A' ? match.odds_a : match.odds_b
    }

    if (existingIndex >= 0) {
      const newCoupon = [...coupon]
      newCoupon[existingIndex] = newSelection
      setCoupon(newCoupon)
    } else {
      setCoupon([...coupon, newSelection])
    }
  }

  const totalOdds = coupon.reduce((acc, curr) => acc * curr.odds, 1)
  const potentialWin = Math.floor(stake * totalOdds)

  const handlePlaceCoupon = async () => {
    if (stake <= 0) return alert('Nie można obstawić 0 punktów.')
    
    setLoading(true)
    const result = await placeCoupon(
      coupon.map(s => ({ matchId: s.matchId, prediction: s.prediction, odds: s.odds })),
      stake
    )
    setLoading(false)

    if (result.error) {
      alert(`BŁĄD: ${result.error}`)
    } else {
      alert(`POSZŁO! ${result.success}`)
      setCoupon([])
    }
  }

  // Funkcja pomocnicza do filtrowania meczów w turniejach
  const getFilteredTournaments = (statusFilter: 'ACTIVE' | 'FINISHED') => {
    return initialTournaments?.map(tournament => {
      const filteredMatches = tournament.matches.filter((m: Match) => {
        if (statusFilter === 'ACTIVE') return m.status === 'PENDING' || m.status === 'LIVE'
        if (statusFilter === 'FINISHED') return m.status === 'FINISHED' || m.status === 'CANCELLED'
        return false
      })
      if (filteredMatches.length === 0) return null
      return { ...tournament, matches: filteredMatches }
    }).filter(Boolean)
  }

  const activeTournaments = getFilteredTournaments('ACTIVE')
  const finishedTournaments = getFilteredTournaments('FINISHED')

  // --- RENDEROWANIE POJEDYNCZEGO MECZU ---
  const renderMatchCard = (match: Match, isHistory: boolean) => {
    const isSelectedA = coupon.some(s => s.matchId === match.id && s.prediction === 'A')
    const isSelectedB = coupon.some(s => s.matchId === match.id && s.prediction === 'B')

    return (
      <Card key={match.id} className={`bg-zinc-900 border-zinc-800 transition relative overflow-hidden ${isHistory ? 'opacity-70' : 'hover:border-zinc-700'}`}>
        
        {/* BADGE STATUSU */}
        {match.status === 'LIVE' && <div className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-1 font-bold animate-pulse">LIVE</div>}
        {match.status === 'CANCELLED' && <div className="absolute top-0 right-0 bg-zinc-600 text-white text-xs px-2 py-1 font-bold">ANULOWANY</div>}
        {match.status === 'FINISHED' && <div className="absolute top-0 right-0 bg-zinc-700 text-white text-xs px-2 py-1 font-bold">ZAKOŃCZONY</div>}
        
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* INFO O MECZU */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <Badge variant="outline" className="border-green-900 text-green-500 text-[10px]">{match.game_name}</Badge>
                <span className="text-zinc-500 text-xs font-mono">{new Date(match.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="font-bold text-white text-lg flex items-center justify-center md:justify-start gap-2">
              <span className={match.winner === 'A' ? 'text-yellow-500' : ''}>{match.team_a}</span>
              <span className="text-zinc-600 font-normal text-sm">vs</span>
              <span className={match.winner === 'B' ? 'text-yellow-500' : ''}>{match.team_b}</span>
            </div>
            {match.handicap && <div className="text-blue-400 text-xs mt-1">Handicap: {match.handicap}</div>}
          </div>

          {/* PRZYCISKI LUB WYNIK */}
          {!isHistory && match.status !== 'CANCELLED' ? (
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                onClick={() => toggleSelection(match, 'A')}
                className={`flex-1 md:w-32 h-12 font-bold border transition-all ${isSelectedA 
                  ? 'bg-green-600 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-black text-white border-zinc-700 hover:bg-zinc-800'}`}
              >
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[10px] opacity-70 mb-1">{match.team_a}</span>
                    <span className="text-lg">{match.odds_a.toFixed(2)}</span>
                </div>
              </Button>

              <Button 
                onClick={() => toggleSelection(match, 'B')}
                className={`flex-1 md:w-32 h-12 font-bold border transition-all ${isSelectedB 
                  ? 'bg-green-600 text-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-black text-white border-zinc-700 hover:bg-zinc-800'}`}
              >
                <div className="flex flex-col items-center leading-none">
                    <span className="text-[10px] opacity-70 mb-1">{match.team_b}</span>
                    <span className="text-lg">{match.odds_b.toFixed(2)}</span>
                </div>
              </Button>
            </div>
          ) : (
            // WIDOK DLA HISTORII / ANULOWANYCH
            <div className="px-6 py-2 bg-zinc-950 rounded border border-zinc-800 text-center min-w-[120px]">
                {match.status === 'CANCELLED' ? (
                    <span className="text-zinc-500 font-bold text-sm">ZWROT</span>
                ) : (
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase">Zwycięzca</span>
                        <span className="text-yellow-500 font-black text-lg">
                            {match.winner === 'A' ? match.team_a : (match.winner === 'B' ? match.team_b : 'REMIS')}
                        </span>
                    </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* --- LEWA KOLUMNA: OFERTA Z ZAKŁADKAMI --- */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 mb-6">
                <TabsTrigger value="active" className="data-[state=active]:bg-green-600 data-[state=active]:text-black font-bold">
                    <Calendar className="w-4 h-4 mr-2"/> NADCHODZĄCE / LIVE
                </TabsTrigger>
                <TabsTrigger value="finished" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                    <History className="w-4 h-4 mr-2"/> ZAKOŃCZONE
                </TabsTrigger>
            </TabsList>

            {/* ZAKŁADKA AKTYWNE */}
            <TabsContent value="active" className="space-y-8">
                {activeTournaments && activeTournaments.length > 0 ? activeTournaments.map((tournament: any) => (
                    <div key={tournament.id} className="space-y-4">
                        <div className="flex items-center gap-3 border-l-4 border-green-500 pl-4">
                            <h2 className="text-2xl font-bold text-white uppercase">{tournament.name}</h2>
                        </div>
                        <div className="grid gap-4">
                            {tournament.matches.map((match: Match) => renderMatchCard(match, false))}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 border border-dashed border-zinc-800 rounded bg-zinc-900/20 text-zinc-500">
                        Brak aktywnych meczów.
                    </div>
                )}
            </TabsContent>

            {/* ZAKŁADKA ZAKOŃCZONE */}
            <TabsContent value="finished" className="space-y-8">
                 {finishedTournaments && finishedTournaments.length > 0 ? finishedTournaments.map((tournament: any) => (
                    <div key={tournament.id} className="space-y-4">
                        <div className="flex items-center gap-3 border-l-4 border-zinc-600 pl-4">
                            <h2 className="text-xl font-bold text-zinc-400 uppercase">{tournament.name}</h2>
                        </div>
                        <div className="grid gap-4">
                            {tournament.matches.map((match: Match) => renderMatchCard(match, true))}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 border border-dashed border-zinc-800 rounded bg-zinc-900/20 text-zinc-500">
                        Historia jest pusta.
                    </div>
                )}
            </TabsContent>
        </Tabs>
      </div>

      {/* --- PRAWA KOLUMNA: BET SLIP --- */}
      <div className="lg:col-span-1 lg:sticky lg:top-24">
        <Card className="bg-black border-yellow-600/30 shadow-2xl overflow-hidden">
          <CardHeader className="bg-yellow-600/10 border-b border-yellow-600/20 pb-3">
            <CardTitle className="flex items-center justify-between text-yellow-500">
                <span className="flex items-center gap-2"><Ticket className="w-5 h-5"/> TWÓJ KUPON</span>
                <Badge className="bg-yellow-600 text-black font-bold">{coupon.length}</Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            
            {coupon.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {coupon.map((sel, idx) => (
                  <div key={idx} className="bg-zinc-900/80 p-3 rounded border border-zinc-800 relative group">
                    <button 
                        onClick={() => setCoupon(coupon.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-xs text-green-500 font-bold mb-1">{sel.gameName}</div>
                    <div className="font-bold text-sm text-white mb-1">
                        Typ: <span className="text-yellow-500">{sel.prediction === 'A' ? '1' : '2'}</span> ({sel.teamName})
                    </div>
                    <div className="text-right text-xs text-gray-400 font-mono">Kurs: {sel.odds.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="py-10 text-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded">
                    <p>Kupon pusty.</p>
                    <p className="text-xs mt-1">Kliknij kursy, by dodać.</p>
                </div>
            )}

            <Separator className="bg-zinc-800" />

            <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Kurs całkowity:</span>
                    <span className="text-white font-bold">{totalOdds.toFixed(2)}</span>
                </div>
                
                {/* INPUT STAWKI */}
                <div className="bg-zinc-900 p-2 rounded border border-zinc-700 flex items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Stawka:</span>
                    <Input 
                        type="number" 
                        value={stake} 
                        onChange={(e) => setStake(Number(e.target.value))}
                        className="bg-transparent border-none text-right font-mono text-white focus-visible:ring-0 p-0 h-auto"
                    />
                    <Zap className="w-4 h-4 text-green-500" />
                </div>

                {/* SZYBKIE STAWKI (QUICK BETS) */}
                <div className="grid grid-cols-4 gap-1">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuickBet(100)} 
                        className="h-6 text-[11px] border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold"
                    >
                        +100
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuickBet(500)} 
                        className="h-6 text-[11px] border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold"
                    >
                        +500
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleQuickBet(1000)} 
                        className="h-6 text-[11px] border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold"
                    >
                        +1k
                    </Button>
<Button 
        variant="outline" 
        size="sm" 
        onClick={handleMaxBet} 
        className="h-6 text-[10px] border-yellow-900/50 text-yellow-500 font-bold hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-colors"
    >
        ALL IN
    </Button>
                </div>

                <div className="flex justify-between items-center bg-green-900/20 p-3 rounded border border-green-900/50">
                    <span className="text-xs text-green-400 uppercase font-bold">Ewentualna wygrana:</span>
                    <span className="text-xl font-black text-green-400">{potentialWin} PKT</span>
                </div>

                <Button 
                    onClick={handlePlaceCoupon} 
                    disabled={coupon.length === 0 || loading}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black text-lg h-14 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                >
                    {loading ? 'Wysyłanie...' : 'POSTAW ZAKŁAD'}
                </Button>
                <div className="text-center text-[10px] text-gray-500">
                    Dostępne środki: <span className="text-white">{userPoints}</span> PKT
                </div>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  )
}