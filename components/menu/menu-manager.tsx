'use client'

import { useState } from 'react'
import {
  createCategory, updateCategory, deleteCategory,
  createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability
} from '@/app/actions/menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, EyeOff, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { MenuCategory, MenuItem } from '@/lib/database.types'
import { useRouter } from 'next/navigation'

export function MenuManager({
  categories,
  items,
}: {
  categories: MenuCategory[]
  items: MenuItem[]
}) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id ?? null)

  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null)
  const [catName, setCatName] = useState('')
  const [catLoading, setCatLoading] = useState(false)

  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [itemLoading, setItemLoading] = useState(false)

  const filteredItems = activeCategory
    ? items.filter((i) => i.category_id === activeCategory)
    : items

  function openNewCat() {
    setEditingCat(null)
    setCatName('')
    setCatDialogOpen(true)
  }

  function openEditCat(cat: MenuCategory) {
    setEditingCat(cat)
    setCatName(cat.name)
    setCatDialogOpen(true)
  }

  async function saveCat() {
    if (!catName.trim()) return
    setCatLoading(true)
    const result = editingCat
      ? await updateCategory(editingCat.id, catName)
      : await createCategory(catName)
    setCatLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(editingCat ? 'Category updated' : 'Category created')
    setCatDialogOpen(false)
    router.refresh()
  }

  async function handleDeleteCat(id: string) {
    const result = await deleteCategory(id)
    if (result.error) { toast.error(result.error); return }
    toast.success('Category deleted')
    if (activeCategory === id) setActiveCategory(categories.find((c) => c.id !== id)?.id ?? null)
    router.refresh()
  }

  function openNewItem() {
    setEditingItem(null)
    setItemName('')
    setItemDesc('')
    setItemPrice('')
    setItemCategory(activeCategory ?? categories[0]?.id ?? '')
    setItemDialogOpen(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setItemName(item.name)
    setItemDesc(item.description ?? '')
    setItemPrice(String(item.price))
    setItemCategory(item.category_id)
    setItemDialogOpen(true)
  }

  async function saveItem() {
    if (!itemName.trim() || !itemPrice || !itemCategory) return
    setItemLoading(true)
    const data = {
      categoryId: itemCategory,
      name: itemName,
      description: itemDesc || undefined,
      price: parseFloat(itemPrice),
    }
    const result = editingItem
      ? await updateMenuItem(editingItem.id, { ...data, price: data.price })
      : await createMenuItem(data)
    setItemLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(editingItem ? 'Item updated' : 'Item created')
    setItemDialogOpen(false)
    router.refresh()
  }

  async function handleDeleteItem(id: string) {
    const result = await deleteMenuItem(id)
    if (result.error) { toast.error(result.error); return }
    toast.success('Item deleted')
    router.refresh()
  }

  async function handleToggleAvailability(item: MenuItem) {
    const result = await toggleMenuItemAvailability(item.id, !item.available)
    if (result.error) { toast.error(result.error); return }
    toast.success(item.available ? "Item 86'd" : 'Item available again')
    router.refresh()
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">

      {/* Mobile: horizontal scrolling category chips */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">Categories</span>
          <button
            onClick={openNewCat}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id).length
            const active = activeCategory === cat.id
            return (
              <div key={cat.id} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'
                  }`}
                >
                  {cat.name}
                  <span className={`text-xs tabular-nums ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{count}</span>
                </button>
                <button onClick={() => openEditCat(cat)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                  <Pencil size={11} />
                </button>
                <button onClick={() => handleDeleteCat(cat.id)} className="p-1 rounded text-muted-foreground hover:text-rose-500">
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground py-1.5">No categories yet.</p>
          )}
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden md:block w-48 shrink-0 space-y-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</span>
          <button
            onClick={openNewCat}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        {categories.map((cat) => {
          const count = items.filter((i) => i.category_id === cat.id).length
          return (
            <div key={cat.id} className="group flex items-center gap-1">
              <button
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className={`text-xs tabular-nums shrink-0 ml-2 ${
                  activeCategory === cat.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>{count}</span>
              </button>
              <div className="hidden group-hover:flex gap-0.5 shrink-0">
                <button
                  onClick={() => openEditCat(cat)}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => handleDeleteCat(cat.id)}
                  className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-2">No categories yet.</p>
        )}
      </div>

      {/* Items panel */}
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={openNewItem} size="sm" className="gap-1.5 min-h-[36px]">
            <Plus size={14} />
            Add Item
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors ${
                !item.available ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium text-sm ${!item.available ? 'line-through text-muted-foreground' : ''}`}>
                    {item.name}
                  </p>
                  {!item.available && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      86&apos;d
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                )}
              </div>

              <span className="font-semibold text-sm tabular-nums shrink-0">{formatCurrency(item.price)}</span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  title={item.available ? "86 this item" : "Make available"}
                  className={`p-1.5 rounded-md transition-colors ${
                    item.available
                      ? 'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500'
                      : 'text-emerald-500 hover:bg-emerald-500/10'
                  }`}
                >
                  {item.available ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => openEditItem(item)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No items in this category.</p>
              <button onClick={openNewItem} className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors">
                Add the first item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCat()}
                placeholder="e.g. Starters, Mains, Cocktails"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setCatDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={saveCat} disabled={!catName.trim() || catLoading} className="flex-1">
                {catLoading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={itemCategory} onValueChange={(v) => setItemCategory(v ?? '')}>
                <SelectTrigger className="w-full">
                  <span className="flex-1 text-left text-sm truncate">
                    {categories.find(c => c.id === itemCategory)?.name ?? <span className="text-muted-foreground">Select category</span>}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Caesar Salad"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                id="item-desc"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                className="resize-none h-16 text-sm"
                placeholder="Short description…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-price">Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setItemDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={saveItem}
                disabled={!itemName.trim() || !itemPrice || !itemCategory || itemLoading}
                className="flex-1"
              >
                {itemLoading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
