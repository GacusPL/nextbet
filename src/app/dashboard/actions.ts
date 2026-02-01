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

  // 1. Sprawdź usera
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Zaloguj się.' }

  if (selections.length === 0) return { error: 'Kupon jest pusty.' }
  if (stake < 1) return { error: 'Stawka musi być większa niż 0.' }

  // 2. Sprawdź balans konta
  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', user.id)
    .single()

  if (!profile || profile.points < stake) {
    return { error: 'Brak środków.' }
  }

  // 3. Oblicz kurs całkowity (AKO)
  // (Dla bezpieczeństwa pobieramy kursy z bazy, żeby ktoś nie podmienił ich w HTML-u)
  // Ale na potrzeby MVP zaufamy temu co przyszło, z szybką weryfikacją w przyszłości.
  const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1)
  const potentialWin = Math.floor(stake * totalOdds)

  // 4. TRANSACTION MODE (Wszystko albo nic)
  
  // A. Zabierz punkty
  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ points: profile.points - stake })
    .eq('id', user.id)

  if (balanceError) return { error: 'Błąd transakcji.' }

  // B. Stwórz Kupon
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
    // W razie błędu oddaj punkty (Rollback dla ubogich)
    await supabase.from('profiles').update({ points: profile.points }).eq('id', user.id)
    return { error: 'Nie udało się stworzyć kuponu.' }
  }

  // C. Dodaj pozycje do kuponu
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

// --- 5. CASHOUT (Wycofanie zakładu) ---
export async function cashoutCoupon(couponId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Zaloguj się.' }

  // 1. Pobierz kupon
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .eq('user_id', user.id)
    .single()

  if (error || !coupon) return { error: 'Błąd danych.' }
  
  // Oblicz kwotę (90%)
  const cashoutValue = Math.floor(coupon.stake * 0.9)

  // 2. ATOMICZNY CASHOUT (Sprawdź i Aktualizuj w jednym ruchu)
  // Próbujemy zmienić status na CASHOUTED, ale TYLKO jeśli obecny to OPEN
  const { data, error: updateError } = await supabase
    .from('coupons')
    .update({ status: 'CASHOUTED' })
    .eq('id', couponId)
    .eq('status', 'OPEN') // <--- ZABEZPIECZENIE PRZED PODWÓJNYM KLIKIEM
    .select()

  // Jeśli update nie zwrócił danych, to znaczy że warunek status='OPEN' nie był spełniony
  if (updateError || !data || data.length === 0) {
      return { error: 'Cashout niemożliwy (kupon zamknięty lub już wypłacony).' }
  }

  // 3. Dopiero teraz oddajemy kasę
  const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
  if (profile) {
    await supabase.from('profiles')
      .update({ points: profile.points + cashoutValue })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard')
  return { success: `Cashout udany! +${cashoutValue} PKT.` }
}