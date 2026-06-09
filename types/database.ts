// Generated from Fine Computers Portal schema — supabase/migrations/001_initial_schema.sql
// Regenerate after schema changes:
//   npx supabase gen types typescript --project-id gyiajuuwippqavnsyqer > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'owner' | 'staff'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string
          role?: 'owner' | 'staff'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'owner' | 'staff'
          created_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
          phone: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      laptops: {
        Row: {
          id: string
          brand: string
          model: string
          processor: string | null
          base_ram_gb: number
          base_storage_gb: number
          storage_type: 'HDD' | 'SSD' | 'NVMe'
          display_size: number | null
          condition: 'new' | 'used' | 'refurbished'
          cost_price: number
          sell_price: number | null
          quantity: number
          supplier_id: string | null
          notes: string | null
          serial_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          processor?: string | null
          base_ram_gb: number
          base_storage_gb: number
          storage_type?: 'HDD' | 'SSD' | 'NVMe'
          display_size?: number | null
          condition?: 'new' | 'used' | 'refurbished'
          cost_price: number
          sell_price?: number | null
          quantity?: number
          supplier_id?: string | null
          notes?: string | null
          serial_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          processor?: string | null
          base_ram_gb?: number
          base_storage_gb?: number
          storage_type?: 'HDD' | 'SSD' | 'NVMe'
          display_size?: number | null
          condition?: 'new' | 'used' | 'refurbished'
          cost_price?: number
          sell_price?: number | null
          quantity?: number
          supplier_id?: string | null
          notes?: string | null
          serial_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laptops_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      components: {
        Row: {
          id: string
          category: string
          name: string
          specification: string | null
          cost_price: number
          sell_price: number
          quantity: number
          supplier_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          name: string
          specification?: string | null
          cost_price: number
          sell_price: number
          quantity?: number
          supplier_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          name?: string
          specification?: string | null
          cost_price?: number
          sell_price?: number
          quantity?: number
          supplier_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "components_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      configs: {
        Row: {
          id: string
          laptop_id: string
          notes: string | null
          laptop_cost_snapshot: number
          laptop_sell_snapshot: number
          total_cost_price: number
          total_sell_price: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          laptop_id: string
          notes?: string | null
          laptop_cost_snapshot: number
          laptop_sell_snapshot: number
          total_cost_price: number
          total_sell_price: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          laptop_id?: string
          notes?: string | null
          laptop_cost_snapshot?: number
          laptop_sell_snapshot?: number
          total_cost_price?: number
          total_sell_price?: number
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configs_laptop_id_fkey"
            columns: ["laptop_id"]
            isOneToOne: false
            referencedRelation: "laptops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      config_items: {
        Row: {
          id: string
          config_id: string
          component_id: string
          quantity: number
          cost_price_snapshot: number
          sell_price_snapshot: number
        }
        Insert: {
          id?: string
          config_id: string
          component_id: string
          quantity?: number
          cost_price_snapshot: number
          sell_price_snapshot: number
        }
        Update: {
          id?: string
          config_id?: string
          component_id?: string
          quantity?: number
          cost_price_snapshot?: number
          sell_price_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "config_items_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          id: string
          customer_id: string | null
          config_id: string | null
          sale_date: string
          total_cost_price: number
          total_sell_price: number
          payment_type: 'cash' | 'installment' | 'card' | 'bank_transfer'
          notes: string | null
          warranty_days: number
          specs_promised: string | null
          serial_number: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          config_id?: string | null
          sale_date?: string
          total_cost_price: number
          total_sell_price: number
          payment_type?: 'cash' | 'installment' | 'card' | 'bank_transfer'
          notes?: string | null
          warranty_days?: number
          specs_promised?: string | null
          serial_number?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          config_id?: string | null
          sale_date?: string
          total_cost_price?: number
          total_sell_price?: number
          payment_type?: 'cash' | 'installment' | 'card' | 'bank_transfer'
          notes?: string | null
          warranty_days?: number
          specs_promised?: string | null
          serial_number?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          item_type: 'laptop' | 'component'
          laptop_id: string | null
          component_id: string | null
          quantity: number
          cost_price_snapshot: number
          sell_price_snapshot: number
        }
        Insert: {
          id?: string
          sale_id: string
          item_type: 'laptop' | 'component'
          laptop_id?: string | null
          component_id?: string | null
          quantity?: number
          cost_price_snapshot: number
          sell_price_snapshot: number
        }
        Update: {
          id?: string
          sale_id?: string
          item_type?: 'laptop' | 'component'
          laptop_id?: string | null
          component_id?: string | null
          quantity?: number
          cost_price_snapshot?: number
          sell_price_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_laptop_id_fkey"
            columns: ["laptop_id"]
            isOneToOne: false
            referencedRelation: "laptops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          }
        ]
      }
      installments: {
        Row: {
          id: string
          sale_id: string
          customer_id: string
          total_amount: number
          down_payment: number
          monthly_installment: number
          start_date: string
          end_date: string
          status: 'active' | 'completed' | 'overdue'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          customer_id: string
          total_amount: number
          down_payment?: number
          monthly_installment: number
          start_date: string
          end_date: string
          status?: 'active' | 'completed' | 'overdue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          customer_id?: string
          total_amount?: number
          down_payment?: number
          monthly_installment?: number
          start_date?: string
          end_date?: string
          status?: 'active' | 'completed' | 'overdue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      settings: {
        Row: {
          id: number
          shop_name: string
          shop_phone: string | null
          shop_address: string | null
          low_stock_laptops: number
          low_stock_components: number
          updated_at: string
        }
        Insert: {
          id?: number
          shop_name?: string
          shop_phone?: string | null
          shop_address?: string | null
          low_stock_laptops?: number
          low_stock_components?: number
          updated_at?: string
        }
        Update: {
          id?: number
          shop_name?: string
          shop_phone?: string | null
          shop_address?: string | null
          low_stock_laptops?: number
          low_stock_components?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_returns: {
        Row: {
          id: string
          customer_id: string
          sale_id: string | null
          issue: string
          status: 'complaint' | 'exchange' | 'resolved'
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          sale_id?: string | null
          issue: string
          status?: 'complaint' | 'exchange' | 'resolved'
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          sale_id?: string | null
          issue?: string
          status?: 'complaint' | 'exchange' | 'resolved'
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          }
        ]
      }
      installment_payments: {
        Row: {
          id: string
          installment_id: string
          amount: number
          paid_at: string
          received_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          installment_id: string
          amount: number
          paid_at?: string
          received_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          installment_id?: string
          amount?: number
          paid_at?: string
          received_by?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_payments_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      user_role: 'owner' | 'staff'
      storage_type: 'HDD' | 'SSD' | 'NVMe'
      item_condition: 'new' | 'used' | 'refurbished'
      payment_type: 'cash' | 'installment' | 'card' | 'bank_transfer'
      installment_status: 'active' | 'completed' | 'overdue'
      sale_item_type: 'laptop' | 'component'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row-type helpers
export type Profile            = Database['public']['Tables']['profiles']['Row']
export type Supplier           = Database['public']['Tables']['suppliers']['Row']
export type Laptop             = Database['public']['Tables']['laptops']['Row']
export type Component          = Database['public']['Tables']['components']['Row']
export type Customer           = Database['public']['Tables']['customers']['Row']
export type Config             = Database['public']['Tables']['configs']['Row']
export type ConfigItem         = Database['public']['Tables']['config_items']['Row']
export type Sale               = Database['public']['Tables']['sales']['Row']
export type SaleItem           = Database['public']['Tables']['sale_items']['Row']
export type Installment        = Database['public']['Tables']['installments']['Row']
export type InstallmentPayment = Database['public']['Tables']['installment_payments']['Row']
export type Settings           = Database['public']['Tables']['settings']['Row']

export type CustomerReturn       = Database['public']['Tables']['customer_returns']['Row']
export type CustomerReturnInsert = Database['public']['Tables']['customer_returns']['Insert']

// Insert helpers
export type LaptopInsert              = Database['public']['Tables']['laptops']['Insert']
export type ComponentInsert           = Database['public']['Tables']['components']['Insert']
export type CustomerInsert            = Database['public']['Tables']['customers']['Insert']
export type ConfigInsert              = Database['public']['Tables']['configs']['Insert']
export type ConfigItemInsert          = Database['public']['Tables']['config_items']['Insert']
export type SaleInsert                = Database['public']['Tables']['sales']['Insert']
export type SaleItemInsert            = Database['public']['Tables']['sale_items']['Insert']
export type InstallmentInsert         = Database['public']['Tables']['installments']['Insert']
export type InstallmentPaymentInsert  = Database['public']['Tables']['installment_payments']['Insert']
