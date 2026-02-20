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
          stripe_refund_id: string | null
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
          stripe_refund_id?: string | null
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
          stripe_refund_id?: string | null
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
      experience_availability: {
        Row: {
          created_at: string | null
          end_time: string
          experience_id: string
          id: string
          start_time: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          weekdays: number[]
        }
        Insert: {
          created_at?: string | null
          end_time?: string
          experience_id: string
          id?: string
          start_time?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          weekdays?: number[]
        }
        Update: {
          created_at?: string | null
          end_time?: string
          experience_id?: string
          id?: string
          start_time?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "experience_availability_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: true
            referencedRelation: "experiences"
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
          cancellation_policy: string | null
          created_at: string | null
          currency: string
          description: string
          duration_minutes: number
          experience_status: string
          extra_person_cents: number
          force_majeure_refund: boolean | null
          id: string
          image_url: string | null
          included_participants: number
          location: unknown
          location_address: string | null
          max_days: number | null
          max_participants: number
          meeting_point: string | null
          min_days: number
          min_participants: number
          partner_id: string
          price_cents: number
          price_per_day_cents: number
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
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string
          description: string
          duration_minutes: number
          experience_status?: string
          extra_person_cents?: number
          force_majeure_refund?: boolean | null
          id?: string
          image_url?: string | null
          included_participants?: number
          location?: unknown
          location_address?: string | null
          max_days?: number | null
          max_participants: number
          meeting_point?: string | null
          min_days?: number
          min_participants?: number
          partner_id: string
          price_cents: number
          price_per_day_cents?: number
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
          cancellation_policy?: string | null
          created_at?: string | null
          currency?: string
          description?: string
          duration_minutes?: number
          experience_status?: string
          extra_person_cents?: number
          force_majeure_refund?: boolean | null
          id?: string
          image_url?: string | null
          included_participants?: number
          location?: unknown
          location_address?: string | null
          max_days?: number | null
          max_participants?: number
          meeting_point?: string | null
          min_days?: number
          min_participants?: number
          partner_id?: string
          price_cents?: number
          price_per_day_cents?: number
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
          address: string | null
          background_color: string | null
          body_font_family: string | null
          card_radius: string | null
          created_at: string | null
          display_name: string
          font_size_base: string | null
          font_weight: string | null
          heading_color: string | null
          heading_font_family: string | null
          heading_font_weight: string | null
          id: string
          is_active: boolean | null
          location: unknown
          location_radius_km: number | null
          logo_url: string | null
          partner_id: string
          slug: string
          text_color: string | null
          title_font_size: string | null
          updated_at: string | null
          widget_cta_margin: string | null
          widget_grid_gap: string | null
          widget_grid_min_width: string | null
          widget_section_padding: string | null
          widget_subtitle: string | null
          widget_text_align: string | null
          widget_title: string | null
          widget_title_enabled: boolean | null
          widget_title_margin: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          background_color?: string | null
          body_font_family?: string | null
          card_radius?: string | null
          created_at?: string | null
          display_name: string
          font_size_base?: string | null
          font_weight?: string | null
          heading_color?: string | null
          heading_font_family?: string | null
          heading_font_weight?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown
          location_radius_km?: number | null
          logo_url?: string | null
          partner_id: string
          slug: string
          text_color?: string | null
          title_font_size?: string | null
          updated_at?: string | null
          widget_cta_margin?: string | null
          widget_grid_gap?: string | null
          widget_grid_min_width?: string | null
          widget_section_padding?: string | null
          widget_subtitle?: string | null
          widget_text_align?: string | null
          widget_title?: string | null
          widget_title_enabled?: boolean | null
          widget_title_margin?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          background_color?: string | null
          body_font_family?: string | null
          card_radius?: string | null
          created_at?: string | null
          display_name?: string
          font_size_base?: string | null
          font_weight?: string | null
          heading_color?: string | null
          heading_font_family?: string | null
          heading_font_weight?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown
          location_radius_km?: number | null
          logo_url?: string | null
          partner_id?: string
          slug?: string
          text_color?: string | null
          title_font_size?: string | null
          updated_at?: string | null
          widget_cta_margin?: string | null
          widget_grid_gap?: string | null
          widget_grid_min_width?: string | null
          widget_section_padding?: string | null
          widget_subtitle?: string | null
          widget_text_align?: string | null
          widget_title?: string | null
          widget_title_enabled?: boolean | null
          widget_title_margin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_configs_partner_fk"
            columns: ["partner_id"]
            isOneToOne: false
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
          preferred_language: string | null
          proposed_times: Json | null
          rental_end_date: string | null
          rental_start_date: string | null
          requested_date: string | null
          requested_time: string | null
          reservation_status: string
          response_deadline: string
          session_id: string | null
          stripe_payment_link_id: string | null
          stripe_payment_link_url: string | null
          time_preference: string | null
          total_cents: number
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
          proposed_times?: Json | null
          rental_end_date?: string | null
          rental_start_date?: string | null
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
          proposed_times?: Json | null
          rental_end_date?: string | null
          rental_start_date?: string | null
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
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      user_partners: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          partner_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          partner_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          partner_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          partner_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          email: string
          id?: string
          partner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          id?: string
          partner_id?: string | null
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
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_distance: {
        Args: { point1: unknown; point2: unknown }
        Returns: number
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_experiences_within_radius: {
        Args: {
          exclude_partner_id?: string
          hotel_location: string
          radius_meters: number
        }
        Returns: {
          description: string
          distance_meters: number
          duration_minutes: number
          experience_status: string
          id: string
          image_url: string
          location: unknown
          max_participants: number
          meeting_point: string
          price_cents: number
          slug: string
          supplier_city: string
          supplier_id: string
          supplier_name: string
          tags: string[]
          title: string
        }[]
      }
      get_user_partner_ids: { Args: never; Returns: string[] }
      gettransactionid: { Args: never; Returns: unknown }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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


// Convenience types
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Distribution = Database['public']['Tables']['distributions']['Row']
export type ExperienceSession = Database['public']['Tables']['experience_sessions']['Row']
export type Experience = Database['public']['Tables']['experiences']['Row']
export type HotelConfig = Database['public']['Tables']['hotel_configs']['Row']
export type Media = Database['public']['Tables']['media']['Row']
export type Partner = Database['public']['Tables']['partners']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type User = Database['public']['Tables']['users']['Row']

// Status enums
export type ReservationStatus = 'pending' | 'approved' | 'declined' | 'expired'
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'
export type SessionStatus = 'available' | 'booked' | 'cancelled'
