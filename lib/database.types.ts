// Application-level type aliases
export type Role = 'admin' | 'crew'
export type TabStatus = 'open' | 'closed'
export type OrderItemStatus = 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned'

// Application-level interfaces for use in components
export interface Profile {
  id: string
  full_name: string
  role: Role
  created_at: string
}

export interface Tab {
  id: string
  name: string
  status: TabStatus
  opened_by: string
  created_at: string
  closed_at: string | null
}

// A "round" — a batch of items sent to the queue together. No status of its own.
export interface Order {
  id: string
  tab_id: string
  taken_by: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StatusEvent {
  id: string
  order_item_id: string
  from_status: OrderItemStatus | null
  to_status: OrderItemStatus
  actor: string
  created_at: string
}

export interface MenuCategory {
  id: string
  name: string
  sort: number
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  available: boolean
  sort: number
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  status: OrderItemStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// Supabase database schema — format matches Supabase CLI output for correct type inference
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'crew'
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'crew' | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'crew' | null
        }
        Relationships: []
      }
      tabs: {
        Row: {
          id: string
          name: string
          status: 'open' | 'closed'
          opened_by: string
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          status?: 'open' | 'closed' | null
          opened_by: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          status?: 'open' | 'closed' | null
          opened_by?: string
          closed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tabs_opened_by_fkey'
            columns: ['opened_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          id: string
          tab_id: string
          taken_by: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tab_id: string
          taken_by: string
          notes?: string | null
        }
        Update: {
          id?: string
          tab_id?: string
          taken_by?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'orders_tab_id_fkey'
            columns: ['tab_id']
            isOneToOne: false
            referencedRelation: 'tabs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_taken_by_fkey'
            columns: ['taken_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      menu_categories: {
        Row: {
          id: string
          name: string
          sort: number
        }
        Insert: {
          id?: string
          name: string
          sort?: number
        }
        Update: {
          id?: string
          name?: string
          sort?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          available: boolean
          sort: number
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          available?: boolean
          sort?: number
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          available?: boolean
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: 'menu_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'menu_categories'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          unit_price: number
          status: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity?: number
          unit_price: number
          status?: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned' | null
          notes?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          unit_price?: number
          status?: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned' | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_menu_item_id_fkey'
            columns: ['menu_item_id']
            isOneToOne: false
            referencedRelation: 'menu_items'
            referencedColumns: ['id']
          }
        ]
      }
      status_events: {
        Row: {
          id: string
          order_item_id: string
          from_status: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned' | null
          to_status: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned'
          actor: string
          created_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          from_status?: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned' | null
          to_status: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned'
          actor: string
        }
        Update: {
          id?: string
          order_item_id?: string
          from_status?: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned' | null
          to_status?: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned'
          actor?: string
        }
        Relationships: [
          {
            foreignKeyName: 'status_events_order_item_id_fkey'
            columns: ['order_item_id']
            isOneToOne: false
            referencedRelation: 'order_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'status_events_actor_fkey'
            columns: ['actor']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'crew'
      tab_status: 'open' | 'closed'
      order_item_status: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
