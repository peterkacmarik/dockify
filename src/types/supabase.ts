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
            orders: {
                Row: {
                    id: string
                    created_at: string
                    customer_id: string | null
                    status: 'new' | 'processing' | 'ready' | 'shipped'
                    external_order_id: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    customer_id?: string | null
                    status?: 'new' | 'processing' | 'ready' | 'shipped'
                    external_order_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    customer_id?: string | null
                    status?: 'new' | 'processing' | 'ready' | 'shipped'
                    external_order_id?: string | null
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    part_number: string
                    quantity: number
                    price: number | null
                    description: string | null
                }
                Insert: {
                    id?: string
                    order_id: string
                    part_number: string
                    quantity: number
                    price?: number | null
                    description?: string | null
                }
                Update: {
                    id?: string
                    order_id?: string
                    part_number?: string
                    quantity?: number
                    price?: number | null
                    description?: string | null
                }
            }
            customers: {
                Row: {
                    id: string
                    name: string
                    external_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    external_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    external_id?: string | null
                    created_at?: string
                }
            }
        }
    }
}
