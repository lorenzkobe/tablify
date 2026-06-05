'use client'

import { useMemo, useState } from 'react'
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
import { Combobox } from '@/components/ui/combobox'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, EyeOff, Eye, UtensilsCrossed, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { MenuCategory, MenuItem } from '@/lib/database.types'

export function MenuManager({
  categories: initialCategories,
  items: initialItems,
}: {
  categories: MenuCategory[]
  items: MenuItem[]
}) {
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategories[0]?.id ?? null)

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

  const [pendingDelete, setPendingDelete] = useState<
    | { type: 'category'; id: string; name: string }
    | { type: 'item'; id: string; name: string }
    | null
  >(null)

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  )

  const filteredItems = activeCategory
    ? items.filter((i) => i.category_id === activeCategory)
    : items

  const activeCat = categories.find((c) => c.id === activeCategory) ?? null

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
    if (result.error || !result.data) { toast.error(result.error ?? 'Something went wrong'); return }
    const saved = result.data
    if (editingCat) {
      setCategories((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
    } else {
      setCategories((prev) => [...prev, saved])
      setActiveCategory(saved.id)
    }
    toast.success(editingCat ? 'Category updated' : 'Category created')
    setCatDialogOpen(false)
  }

  async function runDelete() {
    if (!pendingDelete) return
    if (pendingDelete.type === 'category') {
      const deletedId = pendingDelete.id
      const result = await deleteCategory(deletedId)
      if (result.error) { toast.error(result.error); throw new Error(result.error) }
      setCategories((prev) => prev.filter((c) => c.id !== deletedId))
      setItems((prev) => prev.filter((i) => i.category_id !== deletedId))
      if (activeCategory === deletedId) {
        setActiveCategory(categories.find((c) => c.id !== deletedId)?.id ?? null)
      }
      toast.success('Category deleted')
    } else {
      const deletedId = pendingDelete.id
      const result = await deleteMenuItem(deletedId)
      if (result.error) {
        if (result.code === 'in_use') {
          const item = items.find((i) => i.id === deletedId)
          toast.error(result.error, item?.available ? {
            action: { label: 'Mark unavailable', onClick: () => handleToggleAvailability(item) },
          } : undefined)
        } else {
          toast.error(result.error)
        }
        throw new Error(result.error)
      }
      setItems((prev) => prev.filter((i) => i.id !== deletedId))
      toast.success('Item deleted')
    }
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
    if (result.error || !result.data) { toast.error(result.error ?? 'Something went wrong'); return }
    const saved = result.data
    setItems((prev) =>
      editingItem ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved],
    )
    toast.success(editingItem ? 'Item updated' : 'Item created')
    setItemDialogOpen(false)
  }

  async function handleToggleAvailability(item: MenuItem) {
    const result = await toggleMenuItemAvailability(item.id, !item.available)
    if (result.error || !result.data) { toast.error(result.error ?? 'Something went wrong'); return }
    const saved = result.data
    setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)))
    toast.success(item.available ? 'Item marked unavailable' : 'Item available again')
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">

      {/* ── Mobile: category dropdown ── */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </span>
          <button
            onClick={openNewCat}
            aria-label="Add category"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={15} />
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8">
            <Tag size={20} className="text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No categories yet</p>
            <button
              onClick={openNewCat}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Add a category
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Select
              value={activeCategory ?? undefined}
              onValueChange={(v) => setActiveCategory(v ?? null)}
            >
              <SelectTrigger className="flex-1 h-11">
                <span className="flex flex-1 items-center justify-between gap-2 text-left">
                  <span className="text-sm font-medium truncate">
                    {activeCat?.name ?? (
                      <span className="text-muted-foreground">Select category</span>
                    )}
                  </span>
                  {activeCat && (
                    <span className="text-xs tabular-nums font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {items.filter((i) => i.category_id === activeCat.id).length}
                    </span>
                  )}
                </span>
              </SelectTrigger>
              <SelectContent>
                {sortedCategories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    description={String(items.filter((i) => i.category_id === cat.id).length)}
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => activeCat && openEditCat(activeCat)}
              disabled={!activeCat}
              aria-label="Edit category"
              className="h-11 w-11 shrink-0 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => activeCat && setPendingDelete({ type: 'category', id: activeCat.id, name: activeCat.name })}
              disabled={!activeCat}
              aria-label="Delete category"
              className="h-11 w-11 shrink-0 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Desktop: vertical sidebar ── */}
      <div className="hidden md:flex flex-col w-52 shrink-0">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </span>
          <button
            onClick={openNewCat}
            aria-label="Add category"
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        <nav className="space-y-0.5">
          {sortedCategories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id).length
            const active = activeCategory === cat.id
            return (
              <div
                key={cat.id}
                className="group relative flex items-center gap-0.5"
              >
                {/* Active indicator bar */}
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full transition-all ${
                    active ? 'bg-primary opacity-100' : 'opacity-0'
                  }`}
                />
                <button
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-1 flex items-center justify-between text-left pl-4 pr-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-accent text-foreground font-medium'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className={`text-xs tabular-nums shrink-0 ml-2 font-semibold px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
                <div className="flex gap-0.5 shrink-0">
                  <button
                    onClick={() => openEditCat(cat)}
                    aria-label={`Edit ${cat.name}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setPendingDelete({ type: 'category', id: cat.id, name: cat.name })}
                    aria-label={`Delete ${cat.name}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </nav>

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-8 mt-1">
            <Tag size={18} className="text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground text-center px-3">No categories yet</p>
            <button
              onClick={openNewCat}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Add one
            </button>
          </div>
        )}
      </div>

      {/* ── Items panel ── */}
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground tabular-nums">
            {filteredItems.length}{' '}
            <span className="font-normal">item{filteredItems.length !== 1 ? 's' : ''}</span>
          </p>
          <Button onClick={openNewItem} size="sm" className="gap-1.5 min-h-[44px] px-4">
            <Plus size={14} />
            Add Item
          </Button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-muted-foreground/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {categories.length === 0 ? 'No categories yet' : 'No items in this category'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {categories.length === 0
                  ? 'Add a category first, then add menu items.'
                  : 'Get started by adding the first menu item.'}
              </p>
            </div>
            {categories.length > 0 && (
              <button
                onClick={openNewItem}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Add an item
              </button>
            )}
          </div>
        ) : (
          <div className="surface-raised rounded-xl border border-border overflow-hidden">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 ${
                  index !== 0 ? 'border-t border-border' : ''
                } ${!item.available ? 'opacity-60' : ''}`}
              >
                {/* Availability indicator strip */}
                <span
                  aria-hidden
                  className={`shrink-0 w-1 h-8 rounded-full self-center ${
                    item.available ? 'bg-primary/30' : 'bg-rose-500/40'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm leading-snug ${
                      !item.available ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {item.name}
                    </p>
                    {!item.available && (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                        Unavailable
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Price — prominent, right-aligned */}
                <span className={`font-bold text-sm tabular-nums shrink-0 ${
                  item.available ? 'text-foreground' : 'text-muted-foreground line-through'
                }`}>
                  {formatCurrency(item.price)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    title={item.available ? 'Mark unavailable' : 'Make available'}
                    aria-label={item.available ? `Mark ${item.name} unavailable` : `Make ${item.name} available`}
                    className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-colors ${
                      item.available
                        ? 'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500'
                        : 'text-emerald-500 hover:bg-emerald-500/10'
                    }`}
                  >
                    {item.available ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={() => openEditItem(item)}
                    aria-label={`Edit ${item.name}`}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setPendingDelete({ type: 'item', id: item.id, name: item.name })}
                    aria-label={`Delete ${item.name}`}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Category dialog ── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1 pb-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCat()}
                placeholder="e.g. Starters, Mains, Cocktails"
                autoFocus
                className="h-11"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCatDialogOpen(false)}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCat}
                disabled={!catName.trim() || catLoading}
                className="flex-1 h-11"
              >
                {catLoading ? 'Saving…' : editingCat ? 'Save changes' : 'Create category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Item dialog ── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'New Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1 pb-2">
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Combobox
                id="item-category"
                items={sortedCategories.map((cat) => ({ value: cat.id, label: cat.name }))}
                value={itemCategory}
                onValueChange={setItemCategory}
                placeholder="Select category"
                searchPlaceholder="Search categories…"
                emptyText="No categories found."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Caesar Salad"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">
                Description{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="item-desc"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                className="resize-none h-20 text-sm"
                placeholder="Short description shown to staff taking orders…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
                  ₱
                </span>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="pl-8 h-11 tabular-nums"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setItemDialogOpen(false)}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={saveItem}
                disabled={!itemName.trim() || !itemPrice || !itemCategory || itemLoading}
                className="flex-1 h-11"
              >
                {itemLoading ? 'Saving…' : editingItem ? 'Save changes' : 'Add to menu'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={pendingDelete?.type === 'category' ? 'Delete category?' : 'Delete item?'}
        description={
          pendingDelete?.type === 'category'
            ? <>Deleting <span className="font-medium text-foreground">&ldquo;{pendingDelete.name}&rdquo;</span> removes the category and all of its menu items. This cannot be undone.</>
            : <>Deleting <span className="font-medium text-foreground">&ldquo;{pendingDelete?.name}&rdquo;</span> removes it from the menu. This cannot be undone.</>
        }
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        icon={<Trash2 size={18} />}
        onConfirm={runDelete}
      />
    </div>
  )
}
