'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateProfile, updatePassword } from '@/app/profile/actions'
import { User, Lock, Save, Loader2 } from 'lucide-react'

export default function ProfileForm({ initialUsername }: { initialUsername: string }) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (formData: FormData, action: Function) => {
    setLoading(true)
    const result = await action(formData)
    setLoading(false)

    if (result.error) {
      alert(`BŁĄD: ${result.error}`)
    } else {
      alert(`SUKCES: ${result.success}`)
    }
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-zinc-900 mb-6">
<TabsTrigger
  value="general"
  className="
    text-zinc-400
    hover:text-white
    font-bold
    data-[state=active]:bg-green-600
    data-[state=active]:text-black
  "
>
  <User className="w-4 h-4 mr-2" /> DANE PROFILOWE
</TabsTrigger>

<TabsTrigger
  value="security"
  className="
    text-zinc-400
    hover:text-white
    data-[state=active]:bg-red-900/50
    data-[state=active]:text-white
  "
>
  <Lock className="w-4 h-4 mr-2" /> BEZPIECZEŃSTWO
</TabsTrigger>
      </TabsList>

      {/* ZAKŁADKA 1: DANE */}
      <TabsContent value="general">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle>Twój Wizerunek</CardTitle>
            <CardDescription>Tak widzą Cię inni gracze w rankingu.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={(fd) => handleAction(fd, updateProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label>Nazwa Użytkownika (Nick)</Label>
                <Input 
                    name="username" 
                    defaultValue={initialUsername} 
                    className="bg-black border-zinc-700 text-white" 
                    required 
                    minLength={3}
                />
              </div>
              <Button disabled={loading} className="bg-green-600 hover:bg-green-700 text-black font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Save className="w-4 h-4 mr-2"/> Zapisz Zmiany</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ZAKŁADKA 2: HASŁO */}
      <TabsContent value="security">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-red-500">Zmiana Hasła</CardTitle>
            <CardDescription>Uważaj, żeby nie zapomnieć nowego hasła.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={(fd) => handleAction(fd, updatePassword)} className="space-y-4">
  <div className="space-y-2">
    <Label className="text-zinc-400">Nowe Hasło</Label>
    <Input
      name="password"
      type="password"
      className="bg-black border-zinc-700 text-white"
      required
      minLength={6}
    />
  </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Powtórz Hasło</Label>
            <Input
              name="confirmPassword"
              type="password"
              className="bg-black border-zinc-700 text-white"
              required
              minLength={6}
            />
          </div>
        
          <Button variant="destructive" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zmień Hasło'}
          </Button>
        </form>

          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}