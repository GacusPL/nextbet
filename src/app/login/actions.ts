'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const message = encodeURIComponent('Błędne dane logowania. Próbujesz oszukać?')

  redirect(
    `/login?status=error&type=login&message=${message}`
  )
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  
  if (password.length < 6) {
      const message = encodeURIComponent('Hasło musi mieć minimum 6 znaków!')
  redirect(
    `/login?status=warning&type=signup&message=${message}`
  )
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error(error)
    const message = encodeURIComponent('Błąd rejestracji. Sprawdź dane.')

  redirect(
    `/login?status=error&type=signup&message=${message}`
  )
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}