export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          amount_cents: number
          booking_status: string
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          hotel_amount_cents: number
          id: string
          paid_at: string
          platform_amount_cents: number
          reservation_id: string
          session_id: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          supplier_amount_cents: number
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          booking_status?: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          hotel_amount_cents: number
          id?: string
          paid_at?: string
          platform_amount_cents: number
          reservation_id: string
          session_id: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          supplier_amount_cents: number
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          booking_status?: string
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          hotel_amount_cents?: number
          id?: string
          paid_at?: string
          platform_amount_cents?: number
          reservation_id?: string
          session_id?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          supplier_amount_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_reservation_fk"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "experience_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          commission_hotel: number
          commission_platform: number
          commission_supplier: number
          created_at: string | null
          experience_id: string
          hotel_id: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          commission_hotel?: number
          commission_platform?: number
          commission_supplier?: number
          created_at?: string | null
          experience_id: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          commission_hotel?: number
          commission_platform?: number
          commission_supplier?: number
          created_at?: string | null
          experience_id?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "distributions_experience_fk"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_hotel_fk"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_sessions: {
        Row: {
          created_at: string | null
          experience_id: string
          id: string
          price_note: string | null
          price_override_cents: number | null
          session_date: string
          session_status: string
          spots_available: number
          spots_total: number
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          experience_id: string
          id?: string
          price_note?: string | null
          price_override_cents?: number | null
          session_date: string
          session_status?: string
          spots_available: number
          spots_total: number
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          experience_id?: string
          id?: string
          price_note?: string | null
          price_override_cents?: number | null
          session_date?: string
          session_status?: string
          spots_available?: number
          spots_total?: number
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_experience_fk"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          allows_requests: boolean | null
          base_price_cents: number
          created_at: string | null
          currency: string
          description: string
          duration_minutes: number
          experience_status: string
          extra_person_cents: number
          id: string
          image_url: string | null
          included_participants: number
          max_participants: number
          meeting_point: string | null
          min_participants: number
          partner_id: string
          price_cents: number
          pricing_type: string
          slug: string
          tags: string[]
          title: string
          updated_at: string | null
        }
        Insert: {
          allows_requests?: boolean | null
          base_price_cents?: number
          created_at?: string | null
          currency?: string
          description: string
          duration_minutes: number
          experience_status?: string
          extra_person_cents?: number
          id?: string
          image_url?: string | null
          included_participants?: number
          max_participants: number
          meeting_point?: string | null
          min_participants?: number
          partner_id: string
          price_cents: number
          pricing_type?: string
          slug: string
          tags?: string[]
          title: string
          updated_at?: string | null
        }
        Update: {
          allows_requests?: boolean | null
          base_price_cents?: number
          created_at?: string | null
          currency?: string
          description?: string
          duration_minutes?: number
          experience_status?: string
          extra_person_cents?: number
          id?: string
          image_url?: string | null
          included_participants?: number
          max_participants?: number
          meeting_point?: string | null
          min_participants?: number
          partner_id?: string
          price_cents?: number
          pricing_type?: string
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_partner_fk"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_configs: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          partner_id: string
          accent_color: string | null
          text_color: string | null
          background_color: string | null
          card_radius: string | null
          heading_font_family: string | null
          body_font_family: string | null
          heading_font_weight: string | null
          font_weight: string | null
          font_size_base: string | null
          title_font_size: string | null
          widget_title_enabled: boolean | null
          widget_title: string | null
          widget_subtitle: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          partner_id: string
          accent_color?: string | null
          text_color?: string | null
          background_color?: string | null
          card_radius?: string | null
          heading_font_family?: string | null
          body_font_family?: string | null
          heading_font_weight?: string | null
          font_weight?: string | null
          font_size_base?: string | null
          title_font_size?: string | null
          widget_title_enabled?: boolean | null
          widget_title?: string | null
          widget_subtitle?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          partner_id?: string
          accent_color?: string | null
          text_color?: string | null
          background_color?: string | null
          card_radius?: string | null
          heading_font_family?: string | null
          body_font_family?: string | null
          heading_font_weight?: string | null
          font_weight?: string | null
          font_size_base?: string | null
          title_font_size?: string | null
          widget_title_enabled?: boolean | null
          widget_title?: string | null
          widget_subtitle?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_configs_partner_fk"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string | null
          experience_id: string | null
          id: string
          media_type: string | null
          partner_id: string
          sort_order: number | null
          storage_path: string
          url: string
        }
        Insert: {
          created_at?: string | null
          experience_id?: string | null
          id?: string
          media_type?: string | null
          partner_id: string
          sort_order?: number | null
          storage_path: string
          url: string
        }
        Update: {
          created_at?: string | null
          experience_id?: string | null
          id?: string
          media_type?: string | null
          partner_id?: string
          sort_order?: number | null
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_experience_fk"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_partner_fk"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          partner_type: string
          phone: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          partner_type: string
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          partner_type?: string
          phone?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string | null
          experience_id: string
          guest_email: string
          guest_name: string
          guest_phone: string | null
          hotel_id: string
          id: string
          is_request: boolean | null
          participants: number
          payment_deadline: string | null
          requested_date: string | null
          requested_time: string | null
          reservation_status: string
          response_deadline: string
          session_id: string | null
          stripe_payment_link_id: string | null
          stripe_payment_link_url: string | null
          total_cents: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          experience_id: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          hotel_id: string
          id?: string
          is_request?: boolean | null
          participants: number
          payment_deadline?: string | null
          requested_date?: string | null
          requested_time?: string | null
          reservation_status?: string
          response_deadline: string
          session_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          total_cents: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          experience_id?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          hotel_id?: string
          id?: string
          is_request?: boolean | null
          participants?: number
          payment_deadline?: string | null
          requested_date?: string | null
          requested_time?: string | null
          reservation_status?: string
          response_deadline?: string
          session_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          total_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_experience_fk"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_fk"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_session_fk"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "experience_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string
          created_at: string | null
          email: string
          id: string
          partner_id: string
          updated_at: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          email: string
          id?: string
          partner_id: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          id?: string
          partner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_partner_fk"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
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

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Booking = Tables<'bookings'>
export type Distribution = Tables<'distributions'>
export type ExperienceSession = Tables<'experience_sessions'>
export type Experience = Tables<'experiences'>
export type HotelConfig = Tables<'hotel_configs'>
export type Media = Tables<'media'>
export type Partner = Tables<'partners'>
export type Reservation = Tables<'reservations'>
export type User = Tables<'users'>

// Status enums
export type ReservationStatus = 'pending' | 'approved' | 'declined' | 'expired'
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'
export type SessionStatus = 'available' | 'full' | 'cancelled'
