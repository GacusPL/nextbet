'use client'

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Ban, Pencil, Save, X, Trash2, Trophy, Clock, Swords } from 'lucide-react'
import { updateMatch, editMatchDetails, deleteMatch } from '@/app/admin/actions'
import { cn } from "@/lib/utils"

type Match = {
  id: number
  game_name: string
  team_a: string
  team_b: string
  odds_a: number
  odds_b: number
  handicap?: string | null
  start_time: string
  status: string
  winner: string | null
}

const ActionForm = ({ 
  matchId, 
  actionType, 
  children, 
  className 
}: { 
  matchId: number, 
  actionType?: string, 
  children: React.ReactNode, 
  className?: string 
}) => (
  <form action={async (formData) => { 
      if(actionType) formData.append('action', actionType);
      await updateMatch(formData); 
  }}>
    <input type="hidden" name="matchId" value={matchId} />
    <div className={className}>{children}</div>
  </form>
)

function MatchEditForm({ match, onCancel }: { match: Match, onCancel: () => void }) {
  const defaultDate = new Date(match.start_time)
  defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset())
  const formattedDate = defaultDate.toISOString().slice(0, 16)


  const inputStyles = "bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-500 focus:ring-yellow-900/20"

  return (
    <form 
      action={async (formData) => {
          await editMatchDetails(formData)
          onCancel()
      }} 
      className="flex flex-col gap-4 p-5 bg-zinc-900 border border-yellow-600/30 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-2">
         <h3 className="text-yellow-500 font-semibold flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Edycja Meczu #{match.id}
         </h3>
      </div>

      <input type="hidden" name="matchId" value={match.id} />
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label className="text-xs text-zinc-400 ml-1 mb-1 block">Gra</label>
            <Input 
                name="gameName" 
                defaultValue={match.game_name} 
                placeholder="Np. CS2" 
                className={inputStyles} 
                required 
            />
          </div>
          <div className="md:col-span-4">
            <label className="text-xs text-zinc-400 ml-1 mb-1 block">Data i czas</label>
            <Input 
                type="datetime-local" 
                name="startTime" 
                defaultValue={formattedDate} 
                className={`${inputStyles} dark:[color-scheme:dark] cursor-pointer`} 
                required 
            />
          </div>
          <div className="md:col-span-3">
             <label className="text-xs text-zinc-400 ml-1 mb-1 block">Handicap</label>
             <Input 
                name="handicap" 
                defaultValue={match.handicap || ''} 
                placeholder="Brak" 
                className={inputStyles} 
             />
          </div>

          <div className="md:col-span-2 flex items-end justify-end gap-2 pb-0.5">
              <Button type="button" variant="ghost" size="icon" onClick={onCancel} title="Anuluj" className="hover:bg-zinc-800 text-zinc-400 hover:text-white">
                <X className="w-5 h-5"/>
              </Button>
              <Button type="submit" size="icon" className="bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_10px_rgba(202,138,4,0.4)]" title="Zapisz">
                <Save className="w-5 h-5"/>
              </Button>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-6 bg-zinc-950/30 p-4 rounded border border-zinc-800/50 mt-2">
          <div className="flex flex-col gap-2">
             <label className="text-xs text-zinc-500 font-bold text-center uppercase tracking-wider">Drużyna A</label>
             <div className="flex gap-2">
                 <Input 
                    name="teamA" 
                    defaultValue={match.team_a} 
                    className={`${inputStyles} text-right font-bold`} 
                    required 
                 />
                 <Input 
                    name="oddsA" 
                    type="number" 
                    step="0.01" 
                    defaultValue={match.odds_a} 
                    className={`${inputStyles} w-24 text-center text-emerald-400 font-mono font-bold border-emerald-900/30 focus:border-emerald-500`} 
                    required 
                 />
             </div>
          </div>

          <div className="flex flex-col gap-2">
             <label className="text-xs text-zinc-500 font-bold text-center uppercase tracking-wider">Drużyna B</label>
             <div className="flex gap-2">
                 <Input 
                    name="oddsB" 
                    type="number" 
                    step="0.01" 
                    defaultValue={match.odds_b} 
                    className={`${inputStyles} w-24 text-center text-emerald-400 font-mono font-bold border-emerald-900/30 focus:border-emerald-500`} 
                    required 
                 />
                 <Input 
                    name="teamB" 
                    defaultValue={match.team_b} 
                    className={`${inputStyles} font-bold`} 
                    required 
                 />
             </div>
          </div>
      </div>
    </form>
  )
}


export default function AdminMatchRow({ match }: { match: Match }) {
  const [isEditing, setIsEditing] = useState(false)

  const isPending = match.status === 'PENDING'
  const isFinished = match.status === 'FINISHED'
  const isCancelled = match.status === 'CANCELLED'
  const isLive = match.status === 'LIVE'
  const isActive = !isFinished && !isCancelled 

  if (isEditing) {
    return <MatchEditForm match={match} onCancel={() => setIsEditing(false)} />
  }

  return (
    <div className={cn(
        "relative flex flex-col xl:flex-row items-stretch xl:items-center justify-between p-0 bg-black rounded-lg border border-zinc-800 transition-all duration-200 group overflow-hidden",
        isLive && "border-red-900/50 shadow-[0_0_15px_-5px_rgba(220,38,38,0.3)]",
        isFinished && "opacity-75 hover:opacity-100"
    )}>
        
        <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            isLive ? "bg-red-600 animate-pulse" : 
            isFinished ? "bg-zinc-700" : 
            isCancelled ? "bg-red-900" : "bg-yellow-600"
        )}></div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 pl-6 items-center">
            
            <div className="flex flex-row md:flex-col gap-2 md:gap-1 items-center md:items-start min-w-[140px] border-b md:border-b-0 md:border-r border-zinc-800 pb-2 md:pb-0 md:pr-4">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                        "border-0 px-2 py-0.5 text-[10px] tracking-wider font-bold",
                        isLive ? "bg-red-600/20 text-red-500" : "bg-zinc-800 text-zinc-400"
                    )}>
                        {match.status}
                    </Badge>
                </div>
                <div className="text-zinc-400 text-xs flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono">
                        {new Date(match.start_time).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                        <span className="mx-1 text-zinc-600">|</span>
                        {new Date(match.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mt-0.5">
                    {match.game_name}
                </div>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-between gap-4 md:px-4">

                <div className="flex-1 text-right flex flex-col justify-center">
                    <span className={cn(
                        "font-bold text-lg leading-tight truncate",
                        match.winner === 'A' ? "text-yellow-400" : "text-zinc-200"
                    )}>
                        {match.team_a}
                        {match.winner === 'A' && <Trophy className="w-3 h-3 text-yellow-500 inline ml-2 mb-1"/>}
                    </span>
                    <span className="text-xs font-mono text-emerald-500 bg-emerald-950/30 border border-emerald-900/50 rounded px-1.5 py-0.5 self-end mt-1 inline-block">
                        x {match.odds_a.toFixed(2)}
                    </span>
                </div>

                <div className="flex flex-col items-center justify-center px-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-600">
                        <Swords className="w-4 h-4" />
                    </div>
                    {match.handicap && (
                      <span className="text-[9px] text-zinc-500 mt-1 font-mono bg-zinc-900 px-1 rounded">
                        {match.handicap}
                      </span>
                    )}
                </div>

                <div className="flex-1 text-left flex flex-col justify-center">
                    <span className={cn(
                        "font-bold text-lg leading-tight truncate",
                        match.winner === 'B' ? "text-yellow-400" : "text-zinc-200"
                    )}>
                        {match.winner === 'B' && <Trophy className="w-3 h-3 text-yellow-500 inline mr-2 mb-1"/>}
                        {match.team_b}
                    </span>
                    <span className="text-xs font-mono text-emerald-500 bg-emerald-950/30 border border-emerald-900/50 rounded px-1.5 py-0.5 self-start mt-1 inline-block">
                        x {match.odds_b.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>

 
        <div className="flex items-center justify-end gap-1 p-3 bg-zinc-950/50 border-t xl:border-t-0 xl:border-l border-zinc-800 w-full xl:w-auto xl:h-auto min-h-[50px]">
            
            {isActive && (
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 text-zinc-500 hover:text-yellow-500 hover:bg-yellow-950/30 transition-colors">
                    <Pencil className="w-4 h-4" />
                </Button>
            )}

            {isPending && (
                <form action={async (formData) => { await deleteMatch(formData) }}>
                   <input type="hidden" name="matchId" value={match.id} />
                   <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-950/30 transition-colors">
                       <Trash2 className="w-4 h-4" />
                   </Button>
                </form>
            )}

            {(isPending || isActive) && <div className="w-px h-5 bg-zinc-800 mx-1"></div>}

            {isPending && (
              <ActionForm matchId={match.id} actionType="LIVE">
                <Button size="sm" className="h-8 bg-zinc-100 hover:bg-white text-black font-bold px-3 text-xs tracking-wide shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  <Play className="w-3 h-3 mr-1.5 fill-current"/> START
                </Button>
              </ActionForm>
            )}
            
            {isActive && (
                <div className="flex gap-1">
                    <ActionForm matchId={match.id} actionType="FINISH_A">
                      <Button size="sm" variant="outline" className="h-8 px-2 text-xs border-zinc-700 hover:border-emerald-500 hover:bg-emerald-950/50 hover:text-emerald-400 transition-all">
                        Win A
                      </Button>
                    </ActionForm>

                    <ActionForm matchId={match.id} actionType="FINISH_B">
                      <Button size="sm" variant="outline" className="h-8 px-2 text-xs border-zinc-700 hover:border-emerald-500 hover:bg-emerald-950/50 hover:text-emerald-400 transition-all">
                        Win B
                      </Button>
                    </ActionForm>
                    
                    <ActionForm matchId={match.id} actionType="CANCEL">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-950/30 transition-colors ml-1" title="Anuluj mecz">
                          <Ban className="w-4 h-4"/>
                        </Button>
                     </ActionForm>
                </div>
            )}

            {isFinished && (
               <div className="px-3 py-1 bg-yellow-950/20 border border-yellow-900/30 rounded text-xs text-yellow-600 font-medium">
                   Zakończony
               </div>
            )}
        </div>
    </div>
  )
}