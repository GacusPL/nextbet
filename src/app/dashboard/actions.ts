'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type Selection = {
  matchId: number
  prediction: 'A' | 'B'
  odds: number
}

export async function placeCoupon(selections: Selection[], stake: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Zaloguj się.' }

  if (selections.length === 0) return { error: 'Kupon jest pusty.' }
  if (stake < 1) return { error: 'Stawka musi być większa niż 0.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()

  if (!profile || profile.points < stake) {
    return { error: 'Brak środków.' }
  }

  const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1)
  const potentialWin = Math.floor(stake * totalOdds)

  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ points: profile.points - stake })
    .eq('id', user.id)

  if (balanceError) return { error: 'Błąd transakcji.' }

  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert({
      user_id: user.id,
      stake: stake,
      total_odds: totalOdds,
      potential_win: potentialWin,
      status: 'OPEN'
    })
    .select()
    .single()

  if (couponError || !coupon) {
    await supabase.from('profiles').update({ points: profile.points }).eq('id', user.id)
    return { error: 'Nie udało się stworzyć kuponu.' }
  }

  const selectionsData = selections.map(sel => ({
    coupon_id: coupon.id,
    match_id: sel.matchId,
    prediction: sel.prediction,
    odds_at_placement: sel.odds
  }))

  const { error: linesError } = await supabase.from('coupon_selections').insert(selectionsData)

  if (linesError) {
     return { error: 'Błąd zapisu typów.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')
  return { success: `Kupon przyjęty! Do wygrania: ${potentialWin} pkt` }
}

export async function cashoutCoupon(couponId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Zaloguj się.' }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .eq('user_id', user.id)
    .single()

  if (error || !coupon) return { error: 'Błąd danych.' }
  
  const cashoutValue = Math.floor(coupon.stake * 0.9)

  const { data, error: updateError } = await supabase
    .from('coupons')
    .update({ status: 'CASHOUTED' })
    .eq('id', couponId)
    .eq('status', 'OPEN') 
    .select()

  if (updateError || !data || data.length === 0) {
      return { error: 'Cashout niemożliwy (kupon zamknięty lub już wypłacony).' }
  }

  const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
  if (profile) {
    await supabase.from('profiles')
      .update({ points: profile.points + cashoutValue })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard')
  return { success: `Cashout udany! +${cashoutValue} PKT.` }
}