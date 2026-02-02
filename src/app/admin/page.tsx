export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createTournament, deleteTournament, createMatch, manageCoupon, toggleUserBan } from './actions'
import AdminMatchRow from '@/components/admin/match-row'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator" 
import { ShieldAlert, Banknote, RotateCcw, XCircle, Swords, Trash2, Users, UserCheck, UserX } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-black text-red-600 flex items-center justify-center flex-col gap-6 p-4 text-center selection:bg-red-900 selection:text-white">
        <ShieldAlert className="w-24 h-24 animate-pulse" />
        <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">ZAKAZ WSTĘPU</h1>
            <p className="text-xl font-bold text-red-500/80">STREFA ADMINA</p>
        </div>
        <Link href="/dashboard">
             <Button variant="outline" className="border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400 mt-4">
                Powrót do panelu gracza
             </Button>
        </Link>
      </div>
    )
  }

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, matches(*)')
    .order('created_at', { ascending: false })

  const { data: coupons } = await supabase
    .from('coupons')
    .select(`
      *,
      profiles (username),
      coupon_selections (
        prediction,
        matches (game_name, team_a, team_b)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 pb-20">
      <header className="max-w-6xl mx-auto mb-10 border-b border-zinc-800 pb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-4xl font-black text-green-500 tracking-tighter">PANEL ADMINISTRATORA</h1>
           <p className="text-gray-400">Zarządzanie ofertą</p>
        </div>
        <div className="flex gap-2">
            <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  className="border-zinc-700 text-zinc-600 hover:text-black hover:border-zinc-500 transition-colors"
                >
                  Podgląd Gracza
                </Button>
            </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto space-y-12">
        
        {}
        <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Swords className="w-6 h-6 text-green-500"/>
                <h2 className="text-2xl font-bold">ROZPISKA GIER</h2>
            </div>

            {}
            <Card className="bg-black border-green-900/50">
                <CardHeader>
                    <CardTitle className="text-sm uppercase text-gray-500">Nowy Turniej</CardTitle>
                </CardHeader>
                <CardContent>
                    {}
                    <form action={async (fd) => { 'use server'; await createTournament(fd) }} className="flex gap-4">
                        <Input name="name" placeholder="Nazwa turnieju" className="bg-zinc-900 border-zinc-700 text-white" required />
                        <Button className="bg-green-600 hover:bg-green-700 text-black font-bold whitespace-nowrap">Stwórz Turniej</Button>
                    </form>
                </CardContent>
            </Card>

            {}
            <div className="grid gap-6">
                {tournaments?.map((tournament) => (
                    <Card key={tournament.id} className="bg-zinc-900 border-zinc-800 shadow-xl">
                        <CardHeader className="bg-black/40 border-b border-zinc-800 pb-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-white">{tournament.name}</h2>
                                    <Badge variant="outline" className="text-gray-500">ID: {tournament.id}</Badge>
                                </div>
                                {}
                                {}
                                <form action={async (fd) => { 'use server'; await deleteTournament(fd) }}>
                                    <input type="hidden" name="tournamentId" value={tournament.id} />
                                    <Button size="sm" variant="destructive" className="bg-red-900/30 text-red-500 hover:bg-red-900/50 border border-red-900/50">
                                        <Trash2 className="w-4 h-4 mr-2"/> USUŃ TURNIEJ
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6">
                            {}
                            <div className="bg-zinc-950/50 p-4 rounded-lg border border-dashed border-zinc-700 mb-6">
                                <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Dodaj mecz do tego turnieju</h3>
                                {}
                                <form action={async (fd) => { 'use server'; await createMatch(fd) }} className="grid gap-4">
                                    <input type="hidden" name="tournamentId" value={tournament.id} />
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <Input name="gameName" placeholder="Gra (np. CS2)" className="bg-zinc-900 border-zinc-700 text-white" required />
                                        <Input name="teamA" placeholder="Team A" className="bg-zinc-900 border-zinc-700 text-white" required />
                                        <Input name="teamB" placeholder="Team B" className="bg-zinc-900 border-zinc-700 text-white" required />
                                        <Input type="datetime-local" name="startTime" className="bg-zinc-900 border-zinc-700 text-white dark:[color-scheme:dark]" required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                                        <div>
                                            <Label className="text-xs text-gray-500">Kurs A</Label>
                                            <Input type="number" step="0.01" name="oddsA" placeholder="1.85" className="bg-zinc-900 border-zinc-700 text-green-400 font-mono" required />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">Kurs B</Label>
                                            <Input type="number" step="0.01" name="oddsB" placeholder="2.10" className="bg-zinc-900 border-zinc-700 text-green-400 font-mono" required />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">Handicap</Label>
                                            <Input name="handicap" placeholder="np. A -1.5" className="bg-zinc-900 border-zinc-700 text-white" />
                                        </div>
                                        <Button size="sm" className="bg-white hover:bg-gray-200 text-black font-bold">Dodaj Grę</Button>
                                    </div>
                                </form>
                            </div>

                            <Separator className="my-4 bg-zinc-800" />

                            {}
                            <div className="space-y-3">
                                {tournament.matches && tournament.matches.length > 0 ? (
                                    tournament.matches.map((match: any) => (
                                        <AdminMatchRow key={match.id} match={match} />
                                    ))
                                ) : (
                                    <p className="text-center text-gray-600 text-sm py-2 italic">Brak gier w tym turnieju.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        {}
        <section className="space-y-6 pt-8 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-4 text-blue-500"><Users className="w-6 h-6"/><h2 className="text-2xl font-bold">LISTA GRACZY</h2></div>
            <div className="grid gap-2">
                {users && users.length > 0 ? users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${u.is_banned ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className={u.is_banned ? 'text-zinc-500 line-through' : 'text-white font-bold'}>{u.username || 'Bez nazwy'}</span>
                            {u.is_admin && <Badge className="bg-yellow-600 text-black">ADMIN</Badge>}
                            <span className="text-sm text-zinc-500 font-mono ml-2">{u.points} PKT</span>
                        </div>
                        
                        {}
                        {!u.is_admin && (
                            <form action={async (formData) => {
                                'use server'
                                await toggleUserBan(formData)
                            }}>
                                <input type="hidden" name="userId" value={u.id} />
                                <input type="hidden" name="action" value={u.is_banned ? 'UNBAN' : 'BAN'} />
                                <Button 
                                    size="sm" 
                                    variant={u.is_banned ? "outline" : "destructive"}
                                    className={`h-8 text-xs ${u.is_banned ? "border-green-800 text-green-900 hover:bg-green-950 hover:text-green-400" : ""}`}
                                    >
                                    {u.is_banned ? <><UserCheck className="w-3 h-3 mr-1"/> ODBANUJ</> : <><UserX className="w-3 h-3 mr-1"/> ZBANUJ</>}
                                </Button>
                            </form>
                        )}
                    </div>
                )) : (
                    <p className="text-gray-500">Brak zarejestrowanych graczy.</p>
                )}
            </div>
        </section>

        {}
        <section className="pt-8 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-6 text-yellow-500"><Banknote className="w-6 h-6"/><h2 className="text-2xl font-bold">KONTROLA KUPONÓW</h2></div>
            <div className="grid lg:grid-cols-2 gap-4">
               {coupons?.map((coupon: any) => (
                 <Card key={coupon.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition relative group">
                    
                    {}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                        {}
                        <form action={async (fd) => { 'use server'; await manageCoupon(fd) }}>
                            <input type="hidden" name="couponId" value={coupon.id} />
                            <input type="hidden" name="action" value="DELETE" />
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-600 hover:text-red-500 hover:bg-red-900/20" title="Usuń z bazy">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>

                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-lg font-bold text-white flex items-center gap-2">
                                    {coupon.profiles?.username || 'Anonim'}
                                    <Badge className={
                                        coupon.status === 'WON' ? 'bg-green-600' :
                                        coupon.status === 'LOST' ? 'bg-red-600' :
                                        coupon.status === 'VOIDED' ? 'bg-gray-600' : 'bg-yellow-600 text-black'
                                    }>{coupon.status}</Badge>
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    Stawka: <span className="text-white font-mono">{coupon.stake}</span> ➔ 
                                    Do wygrania: <span className="text-green-400 font-mono font-bold">{coupon.potential_win}</span>
                                </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 pr-6">{new Date(coupon.created_at).toLocaleTimeString()}</div>
                        </div>


                        {}
                     <div className="bg-black/40 p-3 rounded border border-white/5 text-sm space-y-2">
                         {}
                         {(!coupon.coupon_selections || coupon.coupon_selections.length === 0) ? (
                             <div className="text-center py-2">
                                 <p className="text-red-500 font-bold text-xs uppercase tracking-widest">
                                     Błąd krytyczny
                                 </p>
                                 <p className="text-gray-500 text-xs mt-1">
                                     Mecze z tego kuponu zostały całkowicie usunięte z bazy danych.
                                 </p>
                             </div>
                         ) : (
                             coupon.coupon_selections.map((sel: any, idx: number) => {
                                 const matchData = Array.isArray(sel.matches) ? sel.matches[0] : sel.matches;
                             
                                 return (
                                     <div key={idx} className="flex justify-between items-center border-b border-white/5 last:border-0 pb-1 last:pb-0">
                                         <div className="text-gray-300">
                                             {matchData ? (
                                                 <span>{matchData.game_name}: {matchData.team_a} vs {matchData.team_b}</span>
                                             ) : (
                                                 <span className="text-orange-500 text-xs italic flex items-center gap-1">
                                                     Brak danych meczu
                                                 </span>
                                             )}
                                         </div>
                                         <span className="font-bold text-green-500 bg-green-900/20 px-2 rounded text-xs ml-2 whitespace-nowrap">
                                             {sel.prediction}
                                         </span>
                                     </div>
                                 )
                             })
                         )}
                     
                     
                     </div>

                        {}
                        {coupon.status === 'OPEN' && (
                            <div className="grid grid-cols-3 gap-2 pt-2">
                                <form action={async (fd) => { 'use server'; await manageCoupon(fd) }} className="w-full">
                                    <input type="hidden" name="couponId" value={coupon.id} /><input type="hidden" name="action" value="PAY_OUT" />
                                    <Button size="sm" className="w-full bg-green-700 hover:bg-green-600 font-bold text-xs"><Banknote className="w-3 h-3 mr-1"/> WYPŁAĆ</Button>
                                </form>
                                <form action={async (fd) => { 'use server'; await manageCoupon(fd) }} className="w-full">
                                    <input type="hidden" name="couponId" value={coupon.id} /><input type="hidden" name="action" value="VOID" />
                                    <Button size="sm" variant="outline" className="w-full border-zinc-600 text-gray-600 hover:bg-zinc-800 text-xs"><RotateCcw className="w-3 h-3 mr-1"/> ZWROT</Button>
                                </form>
                                <form action={async (fd) => { 'use server'; await manageCoupon(fd) }} className="w-full">
                                    <input type="hidden" name="couponId" value={coupon.id} /><input type="hidden" name="action" value="REJECT" />
                                    <Button size="sm" variant="destructive" className="w-full text-xs"><XCircle className="w-3 h-3 mr-1"/> ODRZUĆ</Button>
                                </form>
                            </div>
                        )}
                        {coupon.status !== 'OPEN' && (
                            <div className="text-center text-xs text-gray-600 uppercase font-bold tracking-widest pt-2 border-t border-zinc-800">
                                Kupon Zamknięty
                            </div>
                        )}
                    </CardContent>
                 </Card>
               ))}
               {(!coupons || coupons.length === 0) && <p className="text-gray-500">Brak kuponów.</p>}
            </div>
        </section>
      </div>

      {}
        <p className="my-20"></p>
      <footer className="py-10 text-center border-t border-white/5 bg-black">
        <div className="container mx-auto px-4 space-y-4">
            <p className="text-gray-600 text-sm">
                &copy; NEXTBET </p>

        </div>
      </footer>

    </div>
    
  )
}