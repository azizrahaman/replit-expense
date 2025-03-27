export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: number
          name: string
          type: string
          balance: number
          description: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          type: string
          balance: number
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          type?: string
          balance?: number
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          id: number
          name: string
          description: string | null
          icon: string | null
          color: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      income_categories: {
        Row: {
          id: number
          name: string
          description: string | null
          icon: string | null
          color: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: number
          account_id: number
          category_id: number
          type: 'income' | 'expense'
          amount: number
          date: string
          description: string | null
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          account_id: number
          category_id: number
          type: 'income' | 'expense'
          amount: number
          date: string
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          account_id?: number
          category_id?: number
          type?: 'income' | 'expense'
          amount?: number
          date?: string
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_income_fkey"
            columns: ["category_id"]
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_expense_fkey"
            columns: ["category_id"]
            referencedRelation: "expense_categories"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}