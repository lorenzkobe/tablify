'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createOrder } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import type { MenuItem, MenuCategory } from '@/lib/database.types'

interface CartItem {
  menuItem: MenuItem
  quantity: number
  notes: string
}

export function NewOrderButton({
  tableId,
  tabId,
  tableName,
}: {
  tableId?: string
  tabId?: string
  tableName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    Promise.all([
      supabase.from('menu_categories').select('*').order('sort'),
      supabase.from('menu_items').select('*').eq('available', true).order('sort'),
    ]).then(([cats, items]) => {
      setCategories(cats.data ?? [])
      setMenuItems(items.data ?? [])
      setActiveCategory(cats.data?.[0]?.id ?? null)
    })
  }, [open])

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === itemId)
      if (!existing) return prev
      if (existing.quantity === 1) return prev.filter((c) => c.menuItem.id !== itemId)
      return prev.map((c) =>
        c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
      )
    })
  }

  function updateItemNotes(itemId: string, notes: string) {
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === itemId ? { ...c, notes } : c))
    )
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * c.menuItem.price, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  const filteredItems = activeCategory
    ? menuItems.filter((i) => i.category_id === activeCategory)
    : menuItems

  async function handleSubmit() {
    if (!cart.length) return
    setLoading(true)

    const result = await createOrder({
      tableId,
      tabId,
      notes: notes || undefined,
      items: cart.map((c) => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        unitPrice: c.menuItem.price,
        notes: c.notes || undefined,
      })),
    })

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Order placed!')
      setOpen(false)
      setCart([])
      setNotes('')
      router.refresh()
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px]">
        <Plus size={16} />
        New Order
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>New Order — {tableName}</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Menu */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Category tabs */}
              <div className="flex gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Items */}
              <div className="overflow-y-auto space-y-1.5 pr-1">
                {filteredItems.map((item) => {
                  const cartItem = cart.find((c) => c.menuItem.id === item.id)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-0.5">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {cartItem ? (
                          <>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-5 text-center text-sm font-medium">{cartItem.quantity}</span>
                          </>
                        ) : null}
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cart */}
            <div className="w-52 flex flex-col gap-3 border-l border-border pl-4 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} />
                <span className="text-sm font-medium">Order</span>
                {cartCount > 0 && (
                  <Badge className="ml-auto">{cartCount}</Badge>
                )}
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-muted-foreground">Add items from the menu.</p>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {cart.map((c) => (
                    <div key={c.menuItem.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-medium truncate flex-1">{c.quantity}× {c.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {formatCurrency(c.quantity * c.menuItem.price)}
                        </p>
                      </div>
                      <Input
                        placeholder="Notes (optional)"
                        value={c.notes}
                        onChange={(e) => updateItemNotes(c.menuItem.id, e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="order-notes">Order notes</Label>
                <Textarea
                  id="order-notes"
                  placeholder="Allergies, preferences…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs h-16 resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={cart.length === 0 || loading}
              className="min-w-[100px]"
            >
              {loading ? 'Placing…' : 'Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
