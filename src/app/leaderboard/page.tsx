import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, ArrowLeft, Medal } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Pobierz TOP 50 graczy (BEZ ZBANOWANYCH)
  const { data: users } = await supabase
    .from('profiles')
    .select('username, points')
    .eq('is_banned', false)
    .order('points', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
            <Link href="/dashboard">
                 <Button variant="ghost" className="text-zinc-400"><ArrowLeft className="mr-2 h-4 w-4"/> Powrót</Button>
            </Link>
            <h1 className="text-3xl font-black text-yellow-500 tracking-tighter flex items-center gap-2">
                <Trophy className="w-8 h-8"/> TOP GRACZE
            </h1>
        </header>

        <Card className="bg-zinc-900 border-yellow-600/30">
            <CardContent className="p-0">
                {users && users.length > 0 ? (
                    users.map((user, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 ${index < 3 ? 'bg-yellow-900/10' : ''}`}>
                            <div className="flex items-center gap-4">
                                <span className={`font-mono font-bold w-8 text-center ${
                                    index === 0 ? 'text-yellow-400 text-xl' : 
                                    index === 1 ? 'text-gray-300 text-lg' :
                                    index === 2 ? 'text-orange-400 text-lg' : 'text-zinc-600'
                                }`}>
                                    {index + 1}
                                </span>
                                <div>
                                    <p className={`font-bold ${index < 3 ? 'text-white' : 'text-zinc-300'}`}>
                                        {user.username || 'Anonim'}
                                    </p>
                                    {index === 0 && <Badge className="bg-yellow-500 text-black text-[10px] h-4 mt-1">KING</Badge>}
                                </div>
                            </div>
                            <div className="font-mono text-green-500 font-bold">
                                {user.points.toLocaleString()} PKT
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-zinc-500 italic">
                        Brak danych.
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}