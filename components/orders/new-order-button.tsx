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
import { Plus, Minus, ShoppingCart, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import type { MenuItem, MenuCategory } from '@/lib/database.types'

interface CartItem {
  menuItem: MenuItem
  quantity: number
  notes: string
}

export function NewOrderButton({
  tabId,
  tabName,
}: {
  tabId: string
  tabName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [query, setQuery] = useState('')

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

  const trimmedQuery = query.trim().toLowerCase()
  const filteredItems = trimmedQuery
    ? menuItems.filter(
        (i) =>
          i.name.toLowerCase().includes(trimmedQuery) ||
          (i.description?.toLowerCase().includes(trimmedQuery) ?? false)
      )
    : activeCategory
      ? menuItems.filter((i) => i.category_id === activeCategory)
      : menuItems

  async function handleSubmit() {
    if (!cart.length) return
    setLoading(true)

    const result = await createOrder({
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
      <Button onClick={() => setOpen(true)} className="gap-2 min-h-[44px] font-semibold">
        <Plus size={16} />
        New Order
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setQuery('')
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
            <DialogTitle className="text-base font-semibold tracking-tight">
              New Order — {tabName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-0 flex-1 overflow-hidden min-h-0">
            {/* Menu panel */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden p-4 min-h-0">
              {/* Search */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items…"
                  className="pl-9 min-h-[44px]"
                />
              </div>

              {/* Category filter chips — hidden while searching (search is global) */}
              {!trimmedQuery && (
                <div className="flex gap-1.5 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={[
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        activeCategory === cat.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-secondary-foreground hover:bg-accent ring-1 ring-border/50',
                      ].join(' ')}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Menu items grid */}
              <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1 flex-1 content-start">
                {filteredItems.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 sm:col-span-2">
                    {trimmedQuery
                      ? `No items match “${query.trim()}”.`
                      : 'No items in this category.'}
                  </p>
                )}
                {filteredItems.map((item) => {
                  const cartItem = cart.find((c) => c.menuItem.id === item.id)
                  return (
                    <div
                      key={item.id}
                      className={[
                        'flex items-center justify-between p-3 rounded-lg border transition-colors',
                        cartItem
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border hover:bg-accent/50',
                      ].join(' ')}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-0.5 tabular-nums">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {cartItem ? (
                          <>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors"
                              aria-label="Remove one"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center text-sm font-semibold tabular-nums">
                              {cartItem.quantity}
                            </span>
                          </>
                        ) : null}
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
                          aria-label="Add to order"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cart / order summary panel */}
            <div className="w-full sm:w-52 flex flex-col gap-3 border-t sm:border-t-0 sm:border-l border-border px-4 py-4 shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <ShoppingCart size={15} className="text-muted-foreground" />
                <span className="text-sm font-semibold">Order</span>
                {cartCount > 0 && (
                  <Badge className="ml-auto h-5 px-1.5 text-xs">{cartCount}</Badge>
                )}
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add items from the menu.
                </p>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 min-h-0 max-h-40 sm:max-h-none">
                  {cart.map((c) => (
                    <div key={c.menuItem.id} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <p className="text-xs font-medium truncate flex-1 leading-tight">
                          {c.quantity}× {c.menuItem.name}
                        </p>
                        <p className="text-xs text-muted-foreground shrink-0 tabular-nums">
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

              <div className="border-t border-border pt-2.5 space-y-0.5">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground" htmlFor="order-notes">
                  Order notes
                </Label>
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

          <DialogFooter className="mx-0 mb-0 px-5 py-4 border-t border-border shrink-0 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={cart.length === 0 || loading}
              className="min-w-[120px] min-h-[44px] gap-2 font-semibold"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin shrink-0" />
                  Placing…
                </>
              ) : 'Place Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
