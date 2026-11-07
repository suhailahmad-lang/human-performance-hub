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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string
          cues: string[]
          description: string
          difficulty: string
          domain: string
          equipment: string[]
          high_intensity: boolean
          id: string
          name: string
          pattern: string
          prescription: string
          slug: string
        }
        Insert: {
          created_at?: string
          cues?: string[]
          description: string
          difficulty: string
          domain: string
          equipment?: string[]
          high_intensity?: boolean
          id?: string
          name: string
          pattern: string
          prescription: string
          slug: string
        }
        Update: {
          created_at?: string
          cues?: string[]
          description?: string
          difficulty?: string
          domain?: string
          equipment?: string[]
          high_intensity?: boolean
          id?: string
          name?: string
          pattern?: string
          prescription?: string
          slug?: string
        }
        Relationships: []
      }
      planned_workouts: {
        Row: {
          blocks: Json
          created_at: string
          domain: string
          duration_min: number
          focus: string
          id: string
          intensity: string
          plan_id: string
          scheduled_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          domain: string
          duration_min: number
          focus: string
          id?: string
          intensity: string
          plan_id: string
          scheduled_date: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          domain?: string
          duration_min?: number
          focus?: string
          id?: string
          intensity?: string
          plan_id?: string
          scheduled_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_workouts_owned_parent"
            columns: ["plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "planned_workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age_range: string | null
          created_at: string
          days_per_week: number | null
          display_name: string | null
          equipment: string[]
          experience: string | null
          gender: string | null
          height_cm: number | null
          id: string
          limitations: string | null
          location: string | null
          onboarded: boolean
          preferred_domains: string[]
          primary_goal: string | null
          secondary_goals: string[]
          session_minutes: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age_range?: string | null
          created_at?: string
          days_per_week?: number | null
          display_name?: string | null
          equipment?: string[]
          experience?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          limitations?: string | null
          location?: string | null
          onboarded?: boolean
          preferred_domains?: string[]
          primary_goal?: string | null
          secondary_goals?: string[]
          session_minutes?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age_range?: string | null
          created_at?: string
          days_per_week?: number | null
          display_name?: string | null
          equipment?: string[]
          experience?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          limitations?: string | null
          location?: string | null
          onboarded?: boolean
          preferred_domains?: string[]
          primary_goal?: string | null
          secondary_goals?: string[]
          session_minutes?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      progress_records: {
        Row: {
          created_at: string
          energy: number | null
          id: string
          notes: string | null
          recorded_on: string
          sleep_quality: number | null
          soreness: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          energy?: number | null
          id?: string
          notes?: string | null
          recorded_on?: string
          sleep_quality?: number | null
          soreness?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          energy?: number | null
          id?: string
          notes?: string | null
          recorded_on?: string
          sleep_quality?: number | null
          soreness?: number | null
          user_id?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          created_at: string
          distance_m: number | null
          exercise_name: string
          id: string
          load_kg: number | null
          reps: number | null
          seconds: number | null
          session_id: string
          set_number: number
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_m?: number | null
          exercise_name: string
          id?: string
          load_kg?: number | null
          reps?: number | null
          seconds?: number | null
          session_id: string
          set_number: number
          user_id: string
        }
        Update: {
          created_at?: string
          distance_m?: number | null
          exercise_name?: string
          id?: string
          load_kg?: number | null
          reps?: number | null
          seconds?: number | null
          session_id?: string
          set_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_owned_parent"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          active: boolean
          created_at: string
          id: string
          rationale: string[]
          safety_notes: string[]
          user_id: string
          week_start: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          rationale?: string[]
          safety_notes?: string[]
          user_id: string
          week_start: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          rationale?: string[]
          safety_notes?: string[]
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          domain: string
          duration_min: number
          id: string
          notes: string | null
          performed_on: string
          planned_workout_id: string | null
          rpe: number | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          duration_min: number
          id?: string
          notes?: string | null
          performed_on?: string
          planned_workout_id?: string | null
          rpe?: number | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          duration_min?: number
          id?: string
          notes?: string | null
          performed_on?: string
          planned_workout_id?: string | null
          rpe?: number | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_owned_parent"
            columns: ["planned_workout_id", "user_id"]
            isOneToOne: false
            referencedRelation: "planned_workouts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "workout_sessions_planned_workout_id_fkey"
            columns: ["planned_workout_id"]
            isOneToOne: false
            referencedRelation: "planned_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finish_workout: {
        Args: {
          p_date: string
          p_duration: number
          p_notes: string
          p_rpe: number
          p_sets: Json
          p_status: string
          p_workout: string
        }
        Returns: string
      }
      replace_training_plan: {
        Args: {
          p_days: Json
          p_rationale: string[]
          p_safety: string[]
          p_start: string
        }
        Returns: string
      }
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
    Enums: {},
  },
} as const
