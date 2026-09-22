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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          target: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          target?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          target?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          accepted_at: string
          consent_text_version: string
          id: string
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string
          consent_text_version?: string
          id?: string
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string
          consent_text_version?: string
          id?: string
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      game_configs: {
        Row: {
          area: string
          enabled: boolean
          game_type: string
          high_threshold: number
          id: string
          item_count: number
          medium_threshold: number
          time_limit_seconds: number
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          enabled?: boolean
          game_type: string
          high_threshold?: number
          id?: string
          item_count?: number
          medium_threshold?: number
          time_limit_seconds?: number
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          enabled?: boolean
          game_type?: string
          high_threshold?: number
          id?: string
          item_count?: number
          medium_threshold?: number
          time_limit_seconds?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_results: {
        Row: {
          accuracy: number
          avg_response_time_ms: number
          completed: boolean
          created_at: string
          difficulty_progression: number
          game_type: string
          id: string
          repeated_errors: number
          session_id: string
          skipped_items: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          avg_response_time_ms?: number
          completed?: boolean
          created_at?: string
          difficulty_progression?: number
          game_type: string
          id?: string
          repeated_errors?: number
          session_id: string
          skipped_items?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          avg_response_time_ms?: number
          completed?: boolean
          created_at?: string
          difficulty_progression?: number
          game_type?: string
          id?: string
          repeated_errors?: number
          session_id?: string
          skipped_items?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "screening_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact: string | null
          created_at: string
          faculty: string | null
          full_name: string
          id: string
          student_number: string | null
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          faculty?: string | null
          full_name?: string
          id: string
          student_number?: string | null
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          faculty?: string | null
          full_name?: string
          id?: string
          student_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          decision: string
          id: string
          notes: string | null
          outcome: string | null
          session_id: string
          staff_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          notes?: string | null
          outcome?: string | null
          session_id: string
          staff_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          notes?: string | null
          outcome?: string | null
          session_id?: string
          staff_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "screening_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_profiles: {
        Row: {
          area: string
          contributing_signals: Json
          created_at: string
          id: string
          risk_band: Database["public"]["Enums"]["risk_band"]
          session_id: string
          user_id: string
        }
        Insert: {
          area: string
          contributing_signals?: Json
          created_at?: string
          id?: string
          risk_band: Database["public"]["Enums"]["risk_band"]
          session_id: string
          user_id: string
        }
        Update: {
          area?: string
          contributing_signals?: Json
          created_at?: string
          id?: string
          risk_band?: Database["public"]["Enums"]["risk_band"]
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_profiles_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "screening_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_sessions: {
        Row: {
          completed_at: string | null
          id: string
          overall_band: Database["public"]["Enums"]["risk_band"] | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          overall_band?: Database["public"]["Enums"]["risk_band"] | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          overall_band?: Database["public"]["Enums"]["risk_band"] | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          request_type: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          request_type?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          request_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "staff" | "admin"
      risk_band: "low" | "medium" | "high"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "staff", "admin"],
      risk_band: ["low", "medium", "high"],
    },
  },
} as const
