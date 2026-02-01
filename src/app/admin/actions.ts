'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Pomocnicza: Czy to Szef?
async function isUserAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin === true
}


// ================== SILNIK ROZLICZENIOWY (NOWY) ==================
async function settleRelatedCoupons(
  matchId: number,
  winner: string | null,
  status: string
) {
  const supabase = await createClient()

  const { data: selections } = await supabase
    .from('coupon_selections')
    .select('id, coupon_id, prediction')
    .eq('match_id', matchId)

  if (!selections || selections.length === 0) return

  for (const selection of selections) {
    let selectionStatus = 'PENDING'

    if (status === 'CANCELLED') {
      selectionStatus = 'VOID'
    } else if (status === 'FINISHED') {
      selectionStatus =
        selection.prediction === winner ? 'WON' : 'LOST'
    } else {
      continue
    }

    await supabase
      .from('coupon_selections')
      .update({ status: selectionStatus })
      .eq('id', selection.id)

    await checkCouponCondition(selection.coupon_id)
  }
}

async function checkCouponCondition(couponId: number) {
  const supabase = await createClient()

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .single()

  const { data: selections } = await supabase
    .from('coupon_selections')
    .select('status')
    .eq('coupon_id', couponId)

  if (!coupon || !selections || coupon.status !== 'OPEN') return

  const hasLost = selections.some(s => s.status === 'LOST')
  const hasPending = selections.some(s => s.status === 'PENDING')
  const hasVoid = selections.some(s => s.status === 'VOID')

  let finalStatus: string = 'OPEN'

  if (hasLost) {
    finalStatus = 'LOST'
  } else if (!hasPending) {
    finalStatus = hasVoid ? 'VOIDED' : 'WON'
  }

  if (finalStatus !== 'OPEN') {
    await supabase
      .from('coupons')
      .update({ status: finalStatus })
      .eq('id', couponId)

    if (finalStatus === 'WON') {
      await payoutUser(coupon.user_id, coupon.potential_win)
    }

    if (finalStatus === 'VOIDED') {
      await payoutUser(coupon.user_id, coupon.stake)
    }
  }
}

async function payoutUser(userId: string, amount: number) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({ points: profile.points + amount })
      .eq('id', userId)
  }
}


export async function createTournament(formData: FormData) {
  try {
    if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }
    const supabase = await createClient()
    const name = formData.get('name') as string
    if (!name) return { error: 'Podaj nazwę turnieju.' }
    const { error } = await supabase.from('tournaments').insert({ name, status: 'ACTIVE' })
    if (error) throw error
    revalidatePath('/admin'); revalidatePath('/dashboard')
    return { success: 'Turniej utworzony.' }
  } catch (err) {
    return { error: 'Błąd przy tworzeniu turnieju.' }
  }
}

// 2. USUWANIE TURNIEJU (NOWE!)
export async function deleteTournament(formData: FormData) {
  try {
    if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }
    const supabase = await createClient()
    const tournamentId = formData.get('tournamentId')

    // Dzięki CASCADE w SQL, usunie to też wszystkie mecze w tym pojedynku
    const { error } = await supabase.from('tournaments').delete().eq('id', Number(tournamentId))
    if (error) throw error

    revalidatePath('/admin'); revalidatePath('/dashboard')
    return { success: 'Turniej i jego mecze usunięte.' }
  } catch (err) {
    console.error(err)
    return { error: 'Nie udało się usunąć turnieju.' }
  }
}

// 3. ZARZĄDZANIE MECZAMI (Tworzenie / Edycja / Usuwanie)
export async function createMatch(formData: FormData) {
  try {
    if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }
    const supabase = await createClient()
    const tournamentId = formData.get('tournamentId')
    const gameName = formData.get('gameName'); const teamA = formData.get('teamA'); const teamB = formData.get('teamB');
    const oddsA = formData.get('oddsA'); const oddsB = formData.get('oddsB'); const startTime = formData.get('startTime');

    if (!tournamentId || !gameName) return { error: 'Brakuje danych.' }
    await supabase.from('matches').insert({
      tournament_id: Number(tournamentId), game_name: gameName, team_a: teamA, team_b: teamB,
      odds_a: Number(oddsA), odds_b: Number(oddsB), handicap: formData.get('handicap') || null,
      start_time: startTime || new Date().toISOString(), status: 'PENDING'
    })

    revalidatePath('/admin'); revalidatePath('/dashboard')
    return { success: 'Mecz dodany.' }
  } catch (err) { return { error: 'Błąd dodawania meczu.' } }
}

export async function deleteMatch(formData: FormData) {
  if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }
  const supabase = await createClient()
  await supabase.from('matches').delete().eq('id', Number(formData.get('matchId')))
  revalidatePath('/admin'); revalidatePath('/dashboard')
  return { success: 'Mecz usunięty.' }
}

export async function updateMatch(formData: FormData) {
  try {
    if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }

    const supabase = await createClient()
    const matchId = Number(formData.get('matchId'))
    const action = formData.get('action') as string

    if (action === 'UPDATE_ODDS') {
      await supabase.from('matches').update({
        odds_a: Number(formData.get('oddsA')),
        odds_b: Number(formData.get('oddsB')),
        handicap: formData.get('handicap'),
        game_name: formData.get('gameName'),
        team_a: formData.get('teamA'),
        team_b: formData.get('teamB'),
        start_time: formData.get('startTime')
      }).eq('id', matchId)

      revalidatePath('/admin')
      return { success: 'Zaktualizowano dane.' }
    }

    let status = 'PENDING'
    let winner: string | null = null

    if (action === 'LIVE') status = 'LIVE'
    if (action === 'FINISH_A') { status = 'FINISHED'; winner = 'A' }
    if (action === 'FINISH_B') { status = 'FINISHED'; winner = 'B' }
    if (action === 'CANCEL') { status = 'CANCELLED'; winner = null }

    const { error } = await supabase
      .from('matches')
      .update({ status, winner })
      .eq('id', matchId)

    if (error) throw error

    // ✅ PEŁNE AUTOMATYCZNE ROZLICZANIE
    if (status === 'FINISHED' || status === 'CANCELLED') {
      await settleRelatedCoupons(matchId, winner, status)
    }

    revalidatePath('/admin')
    revalidatePath('/dashboard')
    return { success: `Status: ${status}` }

  } catch (err) {
    console.error(err)
    return { error: 'Błąd aktualizacji.' }
  }
}


// --- 4. ZARZĄDZANIE KUPONAMI (Interwencja Admina) ---
export async function manageCoupon(formData: FormData) {
  try {
    if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }

    const supabase = await createClient()
    const couponId = formData.get('couponId')
    const action = formData.get('action') as string // 'PAY_OUT', 'VOID', 'REJECT'

    if (!couponId) return { error: 'Brak ID kuponu.' }

    // Pobierz dane kuponu
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single()

    if (fetchError || !coupon) return { error: 'Nie znaleziono kuponu.' }

    // LOGIKA INTERWENCJI
    if (action === 'PAY_OUT') {
      // 1. Oznacz jako WYGRANY
      await supabase.from('coupons').update({ status: 'WON' }).eq('id', couponId)

      // 2. Przelej hajs użytkownikowi
      // (Pobieramy aktualne punkty i dodajemy wygraną)
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', coupon.user_id).single()
      if (profile) {
        await supabase.from('profiles')
          .update({ points: profile.points + coupon.potential_win })
          .eq('id', coupon.user_id)
      }
      revalidatePath('/admin')
      return { success: `Wypłacono ${coupon.potential_win} pkt graczowi.` }
    }

    if (action === 'VOID') {
      // 1. Anuluj (ZWROT STAWKI)
      await supabase.from('coupons').update({ status: 'VOIDED' }).eq('id', couponId)

      // 2. Oddaj stawkę
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', coupon.user_id).single()
      if (profile) {
        await supabase.from('profiles')
          .update({ points: profile.points + coupon.stake })
          .eq('id', coupon.user_id)
      }
      revalidatePath('/admin')
      return { success: 'Kupon anulowany. Stawka zwrócona.' }
    }

    if (action === 'REJECT') {
      // Po prostu przegrana (np. za oszustwo / Klauzulę Liścia)
      await supabase.from('coupons').update({ status: 'LOST' }).eq('id', couponId)
      revalidatePath('/admin')
      return { success: 'Kupon oznaczony jako PRZEGRANY.' }
    }

    if (action === 'DELETE') {
      // Całkowite usunięcie kuponu z bazy (bez zwrotów, bez śladu)
      const { error: deleteError } = await supabase.from('coupons').delete().eq('id', couponId)

      if (deleteError) {
        console.error(deleteError)
        return { error: 'Nie udało się usunąć kuponu.' }
      }

      revalidatePath('/admin')
      return { success: 'Kupon został trwale usunięty.' }
    }

    return { error: 'Nieznana akcja.' }

  } catch (err) {
    console.error(err)
    return { error: 'Błąd operacji na kuponie.' }
  }
}

// --- 5. EDYCJA SZCZEGÓŁÓW MECZU (POPRAWKI) ---
export async function editMatchDetails(formData: FormData) {
  try {
    if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }

    const supabase = await createClient()
    const matchId = formData.get('matchId')

    // Pobieramy nowe dane
    const gameName = formData.get('gameName') as string
    const teamA = formData.get('teamA') as string
    const teamB = formData.get('teamB') as string
    const oddsA = parseFloat(formData.get('oddsA') as string)
    const oddsB = parseFloat(formData.get('oddsB') as string)
    const handicap = formData.get('handicap') as string
    const startTime = formData.get('startTime') as string

    if (!matchId) return { error: 'Brak ID meczu.' }

    const { error } = await supabase
      .from('matches')
      .update({
        game_name: gameName,
        team_a: teamA,
        team_b: teamB,
        odds_a: oddsA,
        odds_b: oddsB,
        handicap: handicap || null, // Jeśli pusty string to null
        start_time: startTime
      })
      .eq('id', Number(matchId))

    if (error) throw error

    revalidatePath('/admin')
    revalidatePath('/dashboard')
    return { success: 'Dane meczu zaktualizowane.' }
  } catch (err) {
    console.error(err)
    return { error: 'Nie udało się zapisać zmian.' }
  }
}

// --- ZARZĄDZANIE UŻYTKOWNIKAMI (BANOWANIE) ---
export async function toggleUserBan(formData: FormData) {
  if (!await isUserAdmin()) return { error: 'Brak uprawnień.' }
  const supabase = await createClient()
  const userId = formData.get('userId') as string
  const shouldBan = formData.get('action') === 'BAN'

  await supabase.from('profiles').update({ is_banned: shouldBan }).eq('id', userId)
  revalidatePath('/admin')
  return { success: shouldBan ? 'Użytkownik zbanowany.' : 'Użytkownik odbanowany.' }
}