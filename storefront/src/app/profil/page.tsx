'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { User, LogOut, Award, Gift, TrendingUp, History, MapPin, Receipt, Check } from 'lucide-react'
import { useThemeToast } from '@/components/ui/ThemeToast'
import { cn } from '@/lib/utils'

interface UserSession {
  name: string
  email: string
  points: number
  tier: 'BRONZE' | 'SILVER' | 'GOLD'
  addresses: {
    street: string
    city: string
    zip: string
    country: string
  }[]
}

interface Transaction {
  id: string
  amount: number
  description: string
  date: string
}

export default function ProfilePage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<string | null>(null)
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useThemeToast()

  // Load user session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gm_user_session')
      const storedTx = localStorage.getItem('gm_loyalty_transactions')
      
      if (!stored) {
        router.push('/prihlasenie')
        return
      }

      setSession(JSON.parse(stored) as UserSession)
      if (storedTx) {
        setTransactions(JSON.parse(storedTx) as Transaction[])
      }
    } catch {
      router.push('/prihlasenie')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('gm_user_session')
    toast({
      title: 'Odhlásenie úspešné',
      description: 'Boli ste bezpečne odhlásený z vášho účtu.',
      variant: 'default',
    })
    router.push('/prihlasenie')
    window.dispatchEvent(new Event('auth-updated'))
  }

  // Redeem reward points
  const handleRedeem = (pointsCost: number, discountValue: number, code: string) => {
    if (!session || session.points < pointsCost) {
      toast({
        title: 'Nedostatok bodov',
        description: 'Na uplatnenie tejto zľavy nemáte dostatok vernostných bodov.',
        variant: 'error',
      })
      return
    }

    const updatedPoints = session.points - pointsCost
    
    // Determine new tier based on points
    let updatedTier = session.tier
    if (updatedPoints >= 500) updatedTier = 'GOLD'
    else if (updatedPoints >= 200) updatedTier = 'SILVER'
    else updatedTier = 'BRONZE'

    const updatedSession: UserSession = {
      ...session,
      points: updatedPoints,
      tier: updatedTier,
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      amount: -pointsCost,
      description: `Výmena bodov za ${discountValue}% zľavový kód (${code})`,
      date: new Date().toISOString().split('T')[0],
    }

    const updatedTx = [newTx, ...transactions]

    localStorage.setItem('gm_user_session', JSON.stringify(updatedSession))
    localStorage.setItem('gm_loyalty_transactions', JSON.stringify(updatedTx))
    
    setSession(updatedSession)
    setTransactions(updatedTx)
    setRedeemedCode(code)

    toast({
      title: 'Body úspešne uplatnené',
      description: `Získali ste zľavový kód: ${code}`,
      variant: 'success',
    })
  }

  // Apply redeemed code to cart
  const handleApplyCouponToCart = async (code: string) => {
    setIsApplyingCoupon(code)
    try {
      const response = await fetch('/api/cart/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountCode: code }),
      })

      if (response.ok) {
        toast({
          title: 'Zľavový kód aplikovaný',
          description: `Zľava ${code} bola pridaná do vášho košíka.`,
          variant: 'success',
        })
        setRedeemedCode(null)
      } else if (response.status === 404) {
        toast({
          title: 'Prázdny košík',
          description: 'Váš nákupný košík je prázdny. Pre uplatnenie zľavy najprv pridajte nejaký produkt do košíka.',
          variant: 'error',
        })
      } else {
        throw new Error('Nepodarilo sa uplatniť kód.')
      }
    } catch {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa automaticky uplatniť zľavový kód v košíku.',
        variant: 'error',
      })
    } finally {
      setIsApplyingCoupon(null)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-(--color-text-muted)">
        Načítavam profil...
      </div>
    )
  }

  if (!session) return null

  // Progress to next tier
  const nextTierInfo = {
    BRONZE: { next: 'SILVER', required: 200, color: 'text-gray-400 bg-gray-100' },
    SILVER: { next: 'GOLD', required: 500, color: 'text-amber-500 bg-amber-50' },
    GOLD: { next: null, required: 0, color: 'text-yellow-600 bg-yellow-50' },
  }[session.tier]

  const progressPct = nextTierInfo.required > 0 
    ? Math.min(100, Math.round((session.points / nextTierInfo.required) * 100))
    : 100

  return (
    <div className="py-8 lg:py-12 bg-gray-50/50 min-h-screen">
      <Container>
        {/* Profile Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-(--color-primary) text-white flex items-center justify-center font-bold text-lg">
              {session.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-(--color-text)">{session.name}</h1>
              <p className="text-xs text-(--color-text-muted)">{session.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-bold transition-all w-fit cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Odhlásiť sa
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Loyalty Card and Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Loyalty Portal Status Card */}
            <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-(--color-primary-light)/20 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-(--color-primary)" />
                <h3 className="font-bold text-base text-(--color-text)">Vernostný program</h3>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-black text-(--color-text)">
                  {session.points}{' '}
                  <span className="text-xs text-(--color-text-muted) font-extrabold uppercase tracking-wide">bodov</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    session.tier === 'GOLD' && "bg-yellow-100 text-yellow-800 border border-yellow-200",
                    session.tier === 'SILVER' && "bg-slate-100 text-slate-800 border border-slate-200",
                    session.tier === 'BRONZE' && "bg-amber-100 text-amber-800 border border-amber-200"
                  )}>
                    {session.tier === 'GOLD' ? 'Zlatý tier' : session.tier === 'SILVER' ? 'Strieborný tier' : 'Bronzový tier'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {nextTierInfo.next && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-(--color-text-muted) font-semibold">
                    <span>Pokrok k úrovni {nextTierInfo.next}</span>
                    <span>{session.points} / {nextTierInfo.required} b.</span>
                  </div>
                  <div className="h-2 bg-gray-100 border border-(--color-border) rounded-full overflow-hidden">
                    <div
                      className="h-full bg-(--color-primary) rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-(--color-text-light)">
                    Získajte ešte <span className="font-bold text-(--color-text)">{nextTierInfo.required - session.points}</span> bodov pre odomknutie lepších zliav!
                  </p>
                </div>
              )}
            </div>

            {/* Address Card */}
            <div className="bg-white border border-(--color-border) rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-(--color-text) flex items-center gap-2 border-b border-(--color-border) pb-2">
                <MapPin className="h-4 w-4 text-(--color-text-light)" />
                Doručovacia adresa
              </h3>
              {session.addresses.map((addr, idx) => (
                <div key={idx} className="text-sm text-(--color-text-muted) leading-relaxed">
                  <p className="font-semibold text-(--color-text)">Predvolená adresa</p>
                  <p>{addr.street}</p>
                  <p>{addr.zip} {addr.city}</p>
                  <p>{addr.country}</p>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: Rewards Center and Transactions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Rewards Center */}
            <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-base text-(--color-text) flex items-center gap-2 border-b border-(--color-border) pb-3">
                <Gift className="h-5 w-5 text-(--color-primary)" />
                Katalóg odmien
              </h3>

              {redeemedCode && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Váš zľavový kód</p>
                    <p className="text-2xl font-black text-green-900 tracking-wider font-mono">{redeemedCode}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isApplyingCoupon === redeemedCode}
                    onClick={() => handleApplyCouponToCart(redeemedCode)}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Automaticky uplatniť v košíku
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reward 1 */}
                <div className="border border-(--color-border) rounded-xl p-4 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-(--color-primary) font-bold bg-(--color-primary-light) px-2 py-0.5 rounded-full w-fit">
                      Zľava 10%
                    </div>
                    <h4 className="font-bold text-sm text-(--color-text)">Uplatniť 10% kupón v košíku</h4>
                    <p className="text-xs text-(--color-text-muted)">
                      Získajte 10% zľavu na celý nákup. Kód sa dá uplatniť priamo v nákupnom košíku.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-(--color-text)">100 bodov</span>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={session.points < 100}
                      onClick={() => handleRedeem(100, 10, 'ZLAVA10')}
                    >
                      Uplatniť body
                    </Button>
                  </div>
                </div>

                {/* Reward 2 */}
                <div className="border border-(--color-border) rounded-xl p-4 space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full w-fit font-bold">
                      Doprava zadarmo
                    </div>
                    <h4 className="font-bold text-sm text-(--color-text)">Bezplatné doručenie</h4>
                    <p className="text-xs text-(--color-text-muted)">
                      Uplatnite si body pre bezplatnú dopravu na akúkoľvek objednávku bez minimálneho limitu.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-(--color-text)">50 bodov</span>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={session.points < 50}
                      onClick={() => handleRedeem(50, 0, 'DOPRAVAFREE')}
                    >
                      Uplatniť body
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions History */}
            <div className="bg-white border border-(--color-border) rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-(--color-text) flex items-center gap-2 border-b border-(--color-border) pb-2">
                <History className="h-4.5 w-4.5 text-(--color-text-light)" />
                História vernostných transakcií
              </h3>
              
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-xs text-(--color-text-muted) py-4 text-center">Zatiaľ nemáte žiadne transakcie.</p>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center text-xs py-2 border-b border-(--color-border) last:border-0">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-(--color-text)">{tx.description}</p>
                        <p className="text-(--color-text-light) text-[10px]">{tx.date}</p>
                      </div>
                      <span className={cn(
                        "font-bold text-sm",
                        tx.amount > 0 ? "text-(--color-primary)" : "text-(--color-error)"
                      )}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} b
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  )
}
