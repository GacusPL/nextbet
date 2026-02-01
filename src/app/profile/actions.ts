'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Brak sesji.' }

  const username = formData.get('username') as string

  if (!username || username.length < 3) {
    return { error: 'Nick musi mieć minimum 3 znaki.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id)

  if (error) return { error: 'Nie udało się zmienić nicku.' }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: 'Nick zaktualizowany.' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Hasła nie są identyczne.' }
  }

  if (password.length < 6) {
    return { error: 'Hasło za krótkie (min. 6 znaków).' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: 'Hasło zostało zmienione.' }
}