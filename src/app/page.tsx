import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {Flame} from "lucide-react";

export default async function Home() {
  //const supabase = await createClient()


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
            <a href="" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white">
                  REGULAMIN SERWISU
                </Button>
            </a>
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
          </div>
        </div>
      </section>

      <footer className="py-10 text-center border-t border-white/5 bg-black">
        <div className="container mx-auto px-4 space-y-4">
            <p className="text-gray-600 text-sm">
                &copy; 2026 NextBet
            </p>
        </div>
      </footer>
    </main>
  );
}