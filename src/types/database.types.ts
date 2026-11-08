export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      bhishi_groups: {
        Row: {
          collection_day: number
          contribution_amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          start_date: string | null
          status: Database['public']['Enums']['group_status']
          updated_at: string
        }
        Insert: {
          collection_day?: number
          contribution_amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database['public']['Enums']['group_status']
          updated_at?: string
        }
        Update: {
          collection_day?: number
          contribution_amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database['public']['Enums']['group_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bhishi_groups_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      contribution_obligations: {
        Row: {
          created_at: string
          expected_amount: number
          id: string
          installment_id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_amount: number
          id?: string
          installment_id: string
          member_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_amount?: number
          id?: string
          installment_id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contribution_obligations_installment_id_fkey'
            columns: ['installment_id']
            isOneToOne: false
            referencedRelation: 'installments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contribution_obligations_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      cycle_members: {
        Row: {
          chit_number: number
          created_at: string
          cycle_id: string
          id: string
          member_id: string
        }
        Insert: {
          chit_number: number
          created_at?: string
          cycle_id: string
          id?: string
          member_id: string
        }
        Update: {
          chit_number?: number
          created_at?: string
          cycle_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cycle_members_cycle_id_fkey'
            columns: ['cycle_id']
            isOneToOne: false
            referencedRelation: 'cycles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cycle_members_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      cycles: {
        Row: {
          collection_day_snapshot: number
          contribution_amount_snapshot: number
          created_at: string
          duration_months: number
          group_id: string
          id: string
          name: string
          start_date: string
          status: Database['public']['Enums']['cycle_status']
          total_members: number
          updated_at: string
        }
        Insert: {
          collection_day_snapshot: number
          contribution_amount_snapshot: number
          created_at?: string
          duration_months: number
          group_id: string
          id?: string
          name: string
          start_date: string
          status?: Database['public']['Enums']['cycle_status']
          total_members: number
          updated_at?: string
        }
        Update: {
          collection_day_snapshot?: number
          contribution_amount_snapshot?: number
          created_at?: string
          duration_months?: number
          group_id?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database['public']['Enums']['cycle_status']
          total_members?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cycles_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'bhishi_groups'
            referencedColumns: ['id']
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          member_id: string
          status: Database['public']['Enums']['membership_status']
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          member_id: string
          status?: Database['public']['Enums']['membership_status']
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          member_id?: string
          status?: Database['public']['Enums']['membership_status']
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'bhishi_groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      installments: {
        Row: {
          created_at: string
          cycle_id: string
          expected_amount: number
          id: string
          installment_number: number
          recipient_member_id: string | null
          scheduled_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          expected_amount: number
          id?: string
          installment_number: number
          recipient_member_id?: string | null
          scheduled_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          expected_amount?: number
          id?: string
          installment_number?: number
          recipient_member_id?: string | null
          scheduled_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'installments_cycle_id_fkey'
            columns: ['cycle_id']
            isOneToOne: false
            referencedRelation: 'cycles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'installments_recipient_member_id_fkey'
            columns: ['recipient_member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'members_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          correction_reason: string | null
          created_at: string
          id: string
          installment_id: string
          is_voided: boolean
          member_id: string
          notes: string | null
          payment_date: string
          payment_method: Database['public']['Enums']['payment_method']
          recorded_by: string | null
          reference_number: string | null
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          correction_reason?: string | null
          created_at?: string
          id?: string
          installment_id: string
          is_voided?: boolean
          member_id: string
          notes?: string | null
          payment_date: string
          payment_method: Database['public']['Enums']['payment_method']
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          correction_reason?: string | null
          created_at?: string
          id?: string
          installment_id?: string
          is_voided?: boolean
          member_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database['public']['Enums']['payment_method']
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payments_obligation_fkey'
            columns: ['installment_id', 'member_id']
            isOneToOne: false
            referencedRelation: 'contribution_obligations'
            referencedColumns: ['installment_id', 'member_id']
          },
          {
            foreignKeyName: 'payments_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_voided_by_fkey'
            columns: ['voided_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          correction_reason: string | null
          created_at: string
          id: string
          installment_id: string
          is_voided: boolean
          notes: string | null
          payment_method: Database['public']['Enums']['payment_method']
          payout_date: string
          recipient_member_id: string
          recorded_by: string | null
          reference_number: string | null
          updated_at: string
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          correction_reason?: string | null
          created_at?: string
          id?: string
          installment_id: string
          is_voided?: boolean
          notes?: string | null
          payment_method: Database['public']['Enums']['payment_method']
          payout_date: string
          recipient_member_id: string
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          correction_reason?: string | null
          created_at?: string
          id?: string
          installment_id?: string
          is_voided?: boolean
          notes?: string | null
          payment_method?: Database['public']['Enums']['payment_method']
          payout_date?: string
          recipient_member_id?: string
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payouts_installment_recipient_fkey'
            columns: ['installment_id', 'recipient_member_id']
            isOneToOne: false
            referencedRelation: 'installments'
            referencedColumns: ['id', 'recipient_member_id']
          },
          {
            foreignKeyName: 'payouts_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payouts_voided_by_fkey'
            columns: ['voided_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_payment: {
        Args: {
          payment_amount: number
          payment_notes?: string | null
          payment_reference?: string | null
          target_obligation_id: string
          target_payment_date: string
          target_payment_method: Database['public']['Enums']['payment_method']
        }
        Returns: string
      }
      record_payout: {
        Args: {
          payout_amount: number
          payout_notes?: string | null
          target_installment_id: string
          target_payment_method: Database['public']['Enums']['payment_method']
          target_payout_date: string
        }
        Returns: string
      }
      activate_cycle: {
        Args: {
          chit_order: Json
          cycle_name: string
          cycle_start_date: string
          target_group_id: string
        }
        Returns: string
      }
      activate_cycle_draft: {
        Args: { target_cycle_id: string }
        Returns: string
      }
      can_access_cycle: { Args: { target_cycle_id: string }; Returns: boolean }
      can_access_group: { Args: { target_group_id: string }; Returns: boolean }
      can_access_installment: {
        Args: { target_installment_id: string }
        Returns: boolean
      }
      can_access_member: {
        Args: { target_member_id: string }
        Returns: boolean
      }
      create_cycle_draft: {
        Args: {
          collection_day: number
          contribution_amount: number
          cycle_name: string
          cycle_start_date: string
          target_group_id: string
        }
        Returns: string
      }
      current_profile_id: { Args: never; Returns: string }
      ensure_own_profile: {
        Args: {
          profile_email?: string
          profile_full_name: string
          profile_phone?: string
        }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_group_member: { Args: { target_group_id: string }; Returns: boolean }
      claim_initial_admin: { Args: never; Returns: string }
      update_user_access: {
        Args: {
          requested_is_active?: boolean | null
          requested_role?: Database['public']['Enums']['user_role'] | null
          target_profile_id: string
        }
        Returns: Json
      }
      set_cycle_chit_order: {
        Args: { chit_order: Json; target_cycle_id: string }
        Returns: undefined
      }
      void_payment: {
        Args: { target_payment_id: string; void_reason: string }
        Returns: string
      }
      void_payout: {
        Args: { target_payout_id: string; void_reason: string }
        Returns: string
      }
    }
    Enums: {
      cycle_status: 'draft' | 'active' | 'completed' | 'cancelled'
      group_status: 'draft' | 'active' | 'completed' | 'archived'
      membership_status: 'active' | 'inactive' | 'removed'
      payment_method: 'cash' | 'upi' | 'bank_transfer' | 'other'
      user_role: 'admin' | 'member'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cycle_status: ['draft', 'active', 'completed', 'cancelled'],
      group_status: ['draft', 'active', 'completed', 'archived'],
      membership_status: ['active', 'inactive', 'removed'],
      payment_method: ['cash', 'upi', 'bank_transfer', 'other'],
      user_role: ['admin', 'member'],
    },
  },
} as const
