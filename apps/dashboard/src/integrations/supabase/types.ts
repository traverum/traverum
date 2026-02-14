export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
          hotel_config_id: string | null
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
          hotel_config_id?: string | null
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
          hotel_config_id?: string | null
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
            foreignKeyName: "distributions_hotel_config_id_fkey"
            columns: ["hotel_config_id"]
            isOneToOne: false
            referencedRelation: "hotel_configs"
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
          session_language: string | null
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
          session_language?: string | null
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
          session_language?: string | null
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
          available_languages: string[]
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
          available_languages?: string[]
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
          available_languages?: string[]
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
          accent_color: string | null
          background_color: string | null
          body_font_family: string | null
          card_radius: string | null
          created_at: string | null
          display_name: string
          font_size_base: string | null
          font_weight: string | null
          heading_font_family: string | null
          heading_font_weight: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          partner_id: string
          slug: string
          text_color: string | null
          title_font_size: string | null
          updated_at: string | null
          widget_subtitle: string | null
          widget_title: string | null
          widget_title_enabled: boolean | null
          widget_text_align: string | null
          widget_section_padding: string | null
          widget_title_margin: string | null
          widget_grid_gap: string | null
          widget_cta_margin: string | null
          widget_grid_min_width: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          body_font_family?: string | null
          card_radius?: string | null
          created_at?: string | null
          display_name: string
          font_size_base?: string | null
          font_weight?: string | null
          heading_font_family?: string | null
          heading_font_weight?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          partner_id: string
          slug: string
          text_color?: string | null
          title_font_size?: string | null
          updated_at?: string | null
          widget_subtitle?: string | null
          widget_title?: string | null
          widget_title_enabled?: boolean | null
          widget_text_align?: string | null
          widget_section_padding?: string | null
          widget_title_margin?: string | null
          widget_grid_gap?: string | null
          widget_cta_margin?: string | null
          widget_grid_min_width?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          body_font_family?: string | null
          card_radius?: string | null
          created_at?: string | null
          display_name?: string
          font_size_base?: string | null
          font_weight?: string | null
          heading_font_family?: string | null
          heading_font_weight?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          partner_id?: string
          slug?: string
          text_color?: string | null
          title_font_size?: string | null
          updated_at?: string | null
          widget_subtitle?: string | null
          widget_title?: string | null
          widget_title_enabled?: boolean | null
          widget_text_align?: string | null
          widget_section_padding?: string | null
          widget_title_margin?: string | null
          widget_grid_gap?: string | null
          widget_cta_margin?: string | null
          widget_grid_min_width?: string | null
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
          hotel_config_id: string | null
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
          time_preference: string | null
          total_cents: number
          preferred_language: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          experience_id: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          hotel_config_id?: string | null
          hotel_id: string
          id?: string
          is_request?: boolean | null
          participants: number
          payment_deadline?: string | null
          preferred_language?: string | null
          requested_date?: string | null
          requested_time?: string | null
          reservation_status?: string
          response_deadline: string
          session_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          time_preference?: string | null
          total_cents: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          experience_id?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          hotel_config_id?: string | null
          hotel_id?: string
          id?: string
          is_request?: boolean | null
          participants?: number
          payment_deadline?: string | null
          preferred_language?: string | null
          requested_date?: string | null
          requested_time?: string | null
          reservation_status?: string
          response_deadline?: string
          session_id?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          time_preference?: string | null
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
            foreignKeyName: "reservations_hotel_config_id_fkey"
            columns: ["hotel_config_id"]
            isOneToOne: false
            referencedRelation: "hotel_configs"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
