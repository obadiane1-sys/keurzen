/**
 * Keurzen — Supabase Database Types
 * Généré manuellement — à régénérer via `supabase gen types typescript` après migration
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          has_seen_onboarding: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          has_seen_onboarding?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          has_seen_onboarding?: boolean;
          updated_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          invite_code?: string;
          updated_at?: string;
        };
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          color: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          color: string;
          joined_at?: string;
        };
        Update: {
          role?: 'owner' | 'admin' | 'member';
          color?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          household_id: string;
          invited_by: string;
          email: string | null;
          channel: 'link' | 'email' | 'contacts' | 'code';
          token: string;
          status: 'pending' | 'sent' | 'accepted' | 'revoked' | 'expired';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          invited_by: string;
          email?: string | null;
          channel?: 'link' | 'email' | 'contacts' | 'code';
          token?: string;
          status?: 'pending' | 'sent' | 'accepted' | 'revoked' | 'expired';
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'sent' | 'accepted' | 'revoked' | 'expired';
          channel?: 'link' | 'email' | 'contacts' | 'code';
        };
      };
      tasks: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          due_date: string | null;
          category: string;
          zone: string;
          priority: string;
          estimated_minutes: number | null;
          status: string;
          recurrence: string;
          recurrence_parent_id: string | null;
          completed_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          category: string;
          zone: string;
          priority: string;
          estimated_minutes?: number | null;
          status?: string;
          recurrence?: string;
          recurrence_parent_id?: string | null;
          completed_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          category?: string;
          zone?: string;
          priority?: string;
          estimated_minutes?: number | null;
          status?: string;
          recurrence?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      time_logs: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          household_id: string;
          minutes: number;
          logged_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          household_id: string;
          minutes: number;
          logged_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          minutes?: number;
          note?: string | null;
        };
      };
      tlx_entries: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          week_start: string;
          mental_demand: number;
          physical_demand: number;
          temporal_demand: number;
          performance: number;
          effort: number;
          frustration: number;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          week_start: string;
          mental_demand: number;
          physical_demand: number;
          temporal_demand: number;
          performance: number;
          effort: number;
          frustration: number;
          score: number;
          created_at?: string;
        };
        Update: {
          mental_demand?: number;
          physical_demand?: number;
          temporal_demand?: number;
          performance?: number;
          effort?: number;
          frustration?: number;
          score?: number;
        };
      };
      weekly_stats: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          week_start: string;
          tasks_count: number;
          total_tasks_week: number;
          tasks_share: number;
          tasks_delta: number;
          minutes_total: number;
          total_minutes_week: number;
          minutes_share: number;
          minutes_delta: number;
          expected_share: number;
          computed_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          week_start: string;
          tasks_count: number;
          total_tasks_week: number;
          tasks_share: number;
          tasks_delta: number;
          minutes_total: number;
          total_minutes_week: number;
          minutes_share: number;
          minutes_delta: number;
          expected_share: number;
          computed_at?: string;
        };
        Update: {
          tasks_count?: number;
          total_tasks_week?: number;
          tasks_share?: number;
          tasks_delta?: number;
          minutes_total?: number;
          total_minutes_week?: number;
          minutes_share?: number;
          minutes_delta?: number;
          expected_share?: number;
          computed_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          household_id: string;
          user_id: string | null;
          type: string;
          level: string;
          message: string;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id?: string | null;
          type: string;
          level: string;
          message: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
      budget_expenses: {
        Row: {
          id: string;
          household_id: string;
          paid_by: string;
          amount: number;
          category: string;
          memo: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          paid_by: string;
          amount: number;
          category: string;
          memo?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category?: string;
          memo?: string | null;
          date?: string;
          updated_at?: string;
        };
      };
      budget_splits: {
        Row: {
          id: string;
          household_id: string;
          expense_id: string | null;
          user_id: string;
          mode: string;
          share: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          expense_id?: string | null;
          user_id: string;
          mode: string;
          share: number;
          created_at?: string;
        };
        Update: {
          mode?: string;
          share?: number;
        };
      };
      tour_slides: {
        Row: {
          id: string;
          page: string;
          version: number;
          order: number;
          title: string;
          body: string;
          image_key: string | null;
        };
        Insert: {
          id?: string;
          page: string;
          version: number;
          order: number;
          title: string;
          body: string;
          image_key?: string | null;
        };
        Update: {
          title?: string;
          body?: string;
          image_key?: string | null;
        };
      };
      tour_seen: {
        Row: {
          id: string;
          user_id: string;
          page: string;
          version: number;
          seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          page: string;
          version: number;
          seen_at?: string;
        };
        Update: never;
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          token?: string;
          updated_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          morning_digest: boolean;
          task_reminder: boolean;
          overdue_alert: boolean;
          imbalance_alert: boolean;
          digest_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          morning_digest?: boolean;
          task_reminder?: boolean;
          overdue_alert?: boolean;
          imbalance_alert?: boolean;
          digest_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          morning_digest?: boolean;
          task_reminder?: boolean;
          overdue_alert?: boolean;
          imbalance_alert?: boolean;
          digest_hour?: number;
          updated_at?: string;
        };
      };
      in_app_notifications: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          type: string;
          title: string;
          body: string;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          type: string;
          title: string;
          body: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
