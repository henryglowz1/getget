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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ajos: {
        Row: {
          contribution_amount: number
          created_at: string
          creator_id: string | null
          current_cycle: number | null
          cycle_type: string
          description: string | null
          fee_percentage: number | null
          id: string
          is_public: boolean
          max_members: number
          name: string
          start_date: string
          status: string
          updated_at: string
          withdrawal_order: Json | null
        }
        Insert: {
          contribution_amount: number
          created_at?: string
          creator_id?: string | null
          current_cycle?: number | null
          cycle_type: string
          description?: string | null
          fee_percentage?: number | null
          id?: string
          is_public?: boolean
          max_members?: number
          name: string
          start_date: string
          status?: string
          updated_at?: string
          withdrawal_order?: Json | null
        }
        Update: {
          contribution_amount?: number
          created_at?: string
          creator_id?: string | null
          current_cycle?: number | null
          cycle_type?: string
          description?: string | null
          fee_percentage?: number | null
          id?: string
          is_public?: boolean
          max_members?: number
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
          withdrawal_order?: Json | null
        }
        Relationships: []
      }
      group_invites: {
        Row: {
          ajo_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          invite_code: string
          invitee_email: string
          inviter_id: string
          status: string | null
        }
        Insert: {
          ajo_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code: string
          invitee_email: string
          inviter_id: string
          status?: string | null
        }
        Update: {
          ajo_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          invitee_email?: string
          inviter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_ajo_id_fkey"
            columns: ["ajo_id"]
            isOneToOne: false
            referencedRelation: "ajos"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          ajo_id: string
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          ajo_id: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ajo_id?: string
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_ajo_id_fkey"
            columns: ["ajo_id"]
            isOneToOne: false
            referencedRelation: "ajos"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          ajo_id: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          membership_id: string | null
          metadata: Json | null
          provider_reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          ajo_id?: string | null
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          membership_id?: string | null
          metadata?: Json | null
          provider_reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          ajo_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          membership_id?: string | null
          metadata?: Json | null
          provider_reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_ajo_id_fkey"
            columns: ["ajo_id"]
            isOneToOne: false
            referencedRelation: "ajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_banks: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at: string
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          recipient_code: string | null
          user_id: string
          verification_method: string | null
          verified_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          recipient_code?: string | null
          user_id: string
          verification_method?: string | null
          verified_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          recipient_code?: string | null
          user_id?: string
          verification_method?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          ajo_id: string
          authorization_code: string | null
          card_brand: string | null
          card_last4: string | null
          id: string
          is_active: boolean | null
          joined_at: string
          next_debit_date: string | null
          position: number
          retry_count: number | null
          user_id: string
        }
        Insert: {
          ajo_id: string
          authorization_code?: string | null
          card_brand?: string | null
          card_last4?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          next_debit_date?: string | null
          position: number
          retry_count?: number | null
          user_id: string
        }
        Update: {
          ajo_id?: string
          authorization_code?: string | null
          card_brand?: string | null
          card_last4?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string
          next_debit_date?: string | null
          position?: number
          retry_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_ajo_id_fkey"
            columns: ["ajo_id"]
            isOneToOne: false
            referencedRelation: "ajos"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          contribution_reminders: boolean
          created_at: string
          email_enabled: boolean
          group_updates: boolean
          id: string
          payment_alerts: boolean
          push_enabled: boolean
          push_subscription: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contribution_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          group_updates?: boolean
          id?: string
          payment_alerts?: boolean
          push_enabled?: boolean
          push_subscription?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contribution_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          group_updates?: boolean
          id?: string
          payment_alerts?: boolean
          push_enabled?: boolean
          push_subscription?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_fees: {
        Row: {
          ajo_id: string | null
          created_at: string | null
          cycle: number
          fee_amount: number
          fee_percentage: number | null
          gross_amount: number
          id: string
          net_amount: number
          payout_ledger_id: string | null
          user_id: string
        }
        Insert: {
          ajo_id?: string | null
          created_at?: string | null
          cycle: number
          fee_amount: number
          fee_percentage?: number | null
          gross_amount: number
          id?: string
          net_amount: number
          payout_ledger_id?: string | null
          user_id: string
        }
        Update: {
          ajo_id?: string | null
          created_at?: string | null
          cycle?: number
          fee_amount?: number
          fee_percentage?: number | null
          gross_amount?: number
          id?: string
          net_amount?: number
          payout_ledger_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_fees_ajo_id_fkey"
            columns: ["ajo_id"]
            isOneToOne: false
            referencedRelation: "ajos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fees_payout_ledger_id_fkey"
            columns: ["payout_ledger_id"]
            isOneToOne: false
            referencedRelation: "ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_id: string
          reward_amount: number | null
          reward_paid: boolean | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          reward_paid?: boolean | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          reward_paid?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      user_cards: {
        Row: {
          authorization_code: string
          bank_name: string | null
          card_brand: string
          card_last4: string
          created_at: string
          exp_month: string | null
          exp_year: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          authorization_code: string
          bank_name?: string | null
          card_brand: string
          card_last4: string
          created_at?: string
          exp_month?: string | null
          exp_year?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          authorization_code?: string
          bank_name?: string | null
          card_brand?: string
          card_last4?: string
          created_at?: string
          exp_month?: string | null
          exp_year?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_two_factor: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          totp_secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          received_at: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_2fa_enabled: { Args: { p_user_id: string }; Returns: boolean }
      decrement_wallet_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          new_balance: number
        }[]
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ajo_member: {
        Args: { _ajo_id: string; _user_id: string }
        Returns: boolean
      }
      process_referral_reward: {
        Args: { p_referred_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
