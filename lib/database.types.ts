// Application-level type aliases
export type Role = 'admin' | 'crew' | 'superadmin'
export type TabStatus = 'open' | 'closed'
export type OrderItemStatus = 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned'

// Application-level interfaces for use in components

// A business tenant. Owns its own menu, tabs, orders, users and revenue.
// timezone + open/close_time drive business-day revenue attribution and the
// "bar is closed" order restriction.
export interface Organisation {
  id: string
  name: string
  slug: string
  timezone: string
  open_time: string
  close_time: string
  closes_next_day: boolean
  currency: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: Role
  organisation_id: string | null // null for a superadmin (no org)
  created_at: string
}

export interface Tab {
  id: string
  name: string
  status: TabStatus
  opened_by: string
  organisation_id: string
  created_at: string
  closed_at: string | null
}

// A "round" — a batch of items sent to the queue together. No status of its own.
export interface Order {
  id: string
  tab_id: string
  taken_by: string
  notes: string | null
  organisation_id: string
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
  organisation_id: string
}

export interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  available: boolean
  sort: number
  organisation_id: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  status: OrderItemStatus
  notes: string | null
  organisation_id: string
  created_at: string
  updated_at: string
}

// Supabase database schema — format matches Supabase CLI output for correct type inference
export type Database = {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string
          name: string
          slug: string
          timezone: string
          open_time: string
          close_time: string
          closes_next_day: boolean
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          timezone?: string
          open_time?: string
          close_time?: string
          closes_next_day?: boolean
          currency?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          timezone?: string
          open_time?: string
          close_time?: string
          closes_next_day?: boolean
          currency?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'crew' | 'superadmin'
          organisation_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'crew' | 'superadmin' | null
          organisation_id?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'crew' | 'superadmin' | null
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }
      tabs: {
        Row: {
          id: string
          name: string
          status: 'open' | 'closed'
          opened_by: string
          organisation_id: string
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          status?: 'open' | 'closed' | null
          opened_by: string
          organisation_id: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          status?: 'open' | 'closed' | null
          opened_by?: string
          organisation_id?: string
          closed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tabs_opened_by_fkey'
            columns: ['opened_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tabs_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
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
          organisation_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tab_id: string
          taken_by: string
          notes?: string | null
          organisation_id?: string
        }
        Update: {
          id?: string
          tab_id?: string
          taken_by?: string
          notes?: string | null
          organisation_id?: string
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
          },
          {
            foreignKeyName: 'orders_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
      }
      menu_categories: {
        Row: {
          id: string
          name: string
          sort: number
          organisation_id: string
        }
        Insert: {
          id?: string
          name: string
          sort?: number
          organisation_id: string
        }
        Update: {
          id?: string
          name?: string
          sort?: number
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'menu_categories_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
            referencedColumns: ['id']
          }
        ]
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
          organisation_id: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          available?: boolean
          sort?: number
          organisation_id: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          available?: boolean
          sort?: number
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'menu_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'menu_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'menu_items_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
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
          organisation_id: string
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
          organisation_id?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          unit_price?: number
          status?: 'ordered' | 'in_progress' | 'ready' | 'served' | 'returned' | null
          notes?: string | null
          organisation_id?: string
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
          },
          {
            foreignKeyName: 'order_items_organisation_id_fkey'
            columns: ['organisation_id']
            isOneToOne: false
            referencedRelation: 'organisations'
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
      impersonation_events: {
        Row: {
          id: string
          superadmin_id: string
          target_user_id: string
          action: 'start' | 'stop'
          created_at: string
        }
        Insert: {
          id?: string
          superadmin_id: string
          target_user_id: string
          action: 'start' | 'stop'
        }
        Update: {
          id?: string
          superadmin_id?: string
          target_user_id?: string
          action?: 'start' | 'stop'
        }
        Relationships: [
          {
            foreignKeyName: 'impersonation_events_superadmin_id_fkey'
            columns: ['superadmin_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'impersonation_events_target_user_id_fkey'
            columns: ['target_user_id']
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
      user_role: 'admin' | 'crew' | 'superadmin'
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
