import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, ArrowRight, Calendar,} from "lucide-react";
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      tournaments ( name )
    `)
    .in('status', ['LIVE', 'PENDING'])
    .order('status', { ascending: true }) 
    .order('start_time', { ascending: true })
    .limit(6)


  return (
    <main className="min-h-screen bg-black text-white selection:bg-green-500 selection:text-black">
      
      <nav className="border-b border-green-900/30 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-green-500">NEXT<span className="text-white">BET</span></span>
            <Badge variant="outline" className="border-green-600 text-green-400 text-xs hidden sm:block">
              Projekt NEXT.js
            </Badge>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-green-600 text-green-500 hover:bg-green-900/20 font-bold">
                LOGOWANIE
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700 text-black font-extrabold shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                REJESTRACJA
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 text-center relative z-10">

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
            NEXT <span className="text-gradient">BET</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Innowacyjna platforma do obstawiania meczy z dynamicznymi kursami i statystykami na żywo. 
            Rywalizuj w duchu Fair Play i walcz o najwyższe miejsce w rankingu.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-lg bg-green-600 hover:bg-green-700 text-black font-bold w-full sm:w-auto shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <Flame className="mr-2 h-5 w-5" /> PRZEJDŹ DO WYDARZEŃ
              </Button>
            </Link>
            <Link href="#regulamin">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white">
            REGULAMIN SERWISU
          </Button>
        </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-zinc-950 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                AKTUALNE I NADCHODZĄCE MECZE
                </h2>
                <p className="text-gray-500 text-sm mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Dynamiczna aktualizacja kursów i statystyk
                </p>
            </div>
            
            <Link href="/dashboard" className="text-sm text-green-500 hover:underline flex items-center gap-1">
                Zobacz wszystkie <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {matches && matches.length > 0 ? (
                matches.map((match: any) => (
                    <Card key={match.id} className={`bg-black border-zinc-800 transition-all group relative overflow-hidden ${match.status === 'LIVE' ? 'border-red-900/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]' : 'hover:border-green-900/50'}`}>
                        
                        <div className="absolute top-0 right-0 z-10">
                            {match.status === 'LIVE' ? (
                                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 animate-pulse uppercase tracking-widest">LIVE</span>
                            ) : (
                                <span className="bg-zinc-800 text-gray-400 text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                                    {new Date(match.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            )}
                        </div>

                        <CardHeader className="pb-2 pt-8">
                            <div className="flex justify-center mb-2">
                                <Badge variant="secondary" className="bg-zinc-900 text-gray-300 border border-zinc-700 text-[10px] uppercase tracking-wide">
                                    {match.game_name}
                                </Badge>
                            </div>
                            <CardTitle className="text-center py-2 flex flex-col items-center gap-2 text-xl">
                                <div className="flex justify-between w-full items-center">
                                    <span className="w-[45%] text-right truncate text-white">{match.team_a}</span>
                                    <span className="text-zinc-600 text-xs font-mono">VS</span>
                                    <span className="w-[45%] text-left truncate text-white">{match.team_b}</span>
                                </div>
                                <span className="text-xs text-zinc-500 font-normal truncate max-w-full">
                                    {match.duels?.name}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/dashboard" className="w-full">
                                    <Button variant="outline" className="w-full border-zinc-800 text-white hover:bg-green-900/20 hover:text-green-400 hover:border-green-900/50 h-12 text-lg font-bold bg-zinc-900/50">
                                        {match.odds_a.toFixed(2)}
                                    </Button>
                                </Link>
                                <Link href="/dashboard" className="w-full">
                                    <Button variant="outline" className="w-full border-zinc-800 text-white hover:bg-green-900/20 hover:text-green-400 hover:border-green-900/50 h-12 text-lg font-bold bg-zinc-900/50">
                                        {match.odds_b.toFixed(2)}
                                    </Button>
                                </Link>
                            </div>
                            <p className="text-center text-[10px] text-gray-600 mt-3">
                                Zaloguj się, aby postawić kupon
                            </p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                    <Calendar className="w-12 h-12 mx-auto text-zinc-700 mb-4"/>
                    <h3 className="text-xl font-bold text-gray-500">Brak meczy w rozpisce</h3>
                    <p className="text-gray-600">Niedługo pojawią się nowe mecze.</p>
                </div>
            )}
          </div>
        </div>
      </section>
{/* Sekcja Regulaminu */}
      <section id="regulamin" className="py-20 bg-zinc-950 border-t border-white/5">
  <div className="container mx-auto px-4">
    {}
    <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
      <h2 className="text-3xl font-bold mb-8 text-green-500 uppercase tracking-wider">
        Regulamin Serwisu
      </h2>
      <div className="space-y-6 text-gray-400 leading-relaxed text-sm md:text-base max-w-2xl">
        <p>1. Serwis NextBet służy wyłącznie do celów edukacyjnych i symulacji typowania wyników.</p>
        <p>2. Użytkownik korzystając z serwisu akceptuje zasady Fair Play.</p>
        <p>3. Wszystkie kursy są dynamicznie ustalane przez administację.</p>
        <p>4. Zabrania się wykorzystywania błędów systemu w celu manipulacji rankingiem.</p>
        <p>5. Administratorem danych jest Kaja Thiel oraz Kacper Szponar.</p>
      </div>
    </div>
  </div>
</section>

      {/* Footer */}
      <footer className="py-10 text-center border-t border-white/5 bg-black">
        <div className="container mx-auto px-4 space-y-4">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="#regulamin" className="text-gray-500 hover:text-green-500 text-sm transition-colors">Regulamin</Link>
            <Link href="/login" className="text-gray-500 hover:text-green-500 text-sm transition-colors">Zaloguj się</Link>
          </div>
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} NextBet. Wszystkie prawa zastrzeżone.
          </p>
          <div className="flex justify-center">
             <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-zinc-800">
               N
             </div>
          </div>
        </div>
      </footer>
    </main>
  );
}