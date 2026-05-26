// Bu dosya Supabase MCP aracıyla otomatik üretilmiştir.
// Şema değişikliklerinde `pnpm supabase gen types typescript --project-id lbdbjmnfbflaifvqmxoe --schema public > src/types/database.ts` ile yenile.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          category: string
          city: string | null
          cover_image: string | null
          cover_image_og: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_online: boolean
          organizer_id: string | null
          published_at: string | null
          registration_url: string | null
          rejection_note: string | null
          removed_at: string | null
          slug: string
          source_url: string
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          venue_name: string | null
        }
        Insert: {
          category: string
          city?: string | null
          cover_image?: string | null
          cover_image_og?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_online?: boolean
          organizer_id?: string | null
          published_at?: string | null
          registration_url?: string | null
          rejection_note?: string | null
          removed_at?: string | null
          slug: string
          source_url: string
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          venue_name?: string | null
        }
        Update: {
          category?: string
          city?: string | null
          cover_image?: string | null
          cover_image_og?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_online?: boolean
          organizer_id?: string | null
          published_at?: string | null
          registration_url?: string | null
          rejection_note?: string | null
          removed_at?: string | null
          slug?: string
          source_url?: string
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: Database["public"]["Enums"]["mod_action"]
          changes: Json | null
          created_at: string
          event_id: string
          id: string
          moderator_id: string
          note: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["mod_action"]
          changes?: Json | null
          created_at?: string
          event_id: string
          id?: string
          moderator_id: string
          note?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["mod_action"]
          changes?: Json | null
          created_at?: string
          event_id?: string
          id?: string
          moderator_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          read_at: string | null
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          read_at?: string | null
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          read_at?: string | null
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          interests: string[]
          name: string
          notify_email: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          interests?: string[]
          name?: string
          notify_email?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interests?: string[]
          name?: string
          notify_email?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_by: string | null
          reporter_ip: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_by?: string | null
          reporter_ip?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_by?: string | null
          reporter_ip?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          event_id: string
          id: string
          parse_source: Database["public"]["Enums"]["parse_source_type"]
          raw_url: string
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          event_id: string
          id?: string
          parse_source: Database["public"]["Enums"]["parse_source_type"]
          raw_url: string
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          event_id?: string
          id?: string
          parse_source?: Database["public"]["Enums"]["parse_source_type"]
          raw_url?: string
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      event_status: "pending" | "published" | "rejected" | "removed"
      mod_action: "approved" | "rejected" | "removed" | "edited"
      notif_type:
        | "new_event"
        | "submission_approved"
        | "submission_rejected"
        | "report_resolved"
      parse_source_type: "og" | "gpt4o" | "manual"
      report_reason:
        | "misleading"
        | "spam"
        | "irrelevant"
        | "inappropriate"
        | "other"
      report_status: "open" | "resolved"
      user_role: "user" | "verified_user" | "moderator" | "admin"
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
    Enums: {
      event_status: ["pending", "published", "rejected", "removed"],
      mod_action: ["approved", "rejected", "removed", "edited"],
      notif_type: [
        "new_event",
        "submission_approved",
        "submission_rejected",
        "report_resolved",
      ],
      parse_source_type: ["og", "gpt4o", "manual"],
      report_reason: [
        "misleading",
        "spam",
        "irrelevant",
        "inappropriate",
        "other",
      ],
      report_status: ["open", "resolved"],
      user_role: ["user", "verified_user", "moderator", "admin"],
    },
  },
} as const
