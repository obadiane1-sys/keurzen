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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          data: Json
          household_id: string
          id: string
          level: string
          message: string
          read: boolean
          type: string
          user_id: string | null
          week_start: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          household_id: string
          id?: string
          level: string
          message: string
          read?: boolean
          type: string
          user_id?: string | null
          week_start?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          household_id?: string
          id?: string
          level?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string | null
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          household_id: string
          id: string
          memo: string | null
          paid_by: string
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          date?: string
          household_id: string
          id?: string
          memo?: string | null
          paid_by: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          household_id?: string
          id?: string
          memo?: string | null
          paid_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_splits: {
        Row: {
          created_at: string
          expense_id: string | null
          household_id: string
          id: string
          mode: string
          share: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expense_id?: string | null
          household_id: string
          id?: string
          mode?: string
          share?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expense_id?: string | null
          household_id?: string
          id?: string
          mode?: string
          share?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "budget_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_splits_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          household_id: string
          id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          household_id: string
          id?: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          household_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Relationships: []
      }
      household_members: {
        Row: {
          color: string
          household_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          color?: string
          household_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          color?: string
          household_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      in_app_notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          household_id: string
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          household_id: string
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          household_id?: string
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "in_app_notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string
          created_at: string
          default_unit: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          default_unit?: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          default_unit?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          household_id: string
          id: string
          invited_name: string | null
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          email?: string | null
          expires_at: string
          household_id: string
          id?: string
          invited_name?: string | null
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          household_id?: string
          id?: string
          invited_name?: string | null
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          channel: string
          created_at: string
          email: string | null
          expires_at: string
          first_name: string | null
          household_id: string
          id: string
          invited_by: string
          status: string
          token: string
        }
        Insert: {
          channel?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          first_name?: string | null
          household_id: string
          id?: string
          invited_by: string
          status?: string
          token?: string
        }
        Update: {
          channel?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          first_name?: string | null
          household_id?: string
          id?: string
          invited_by?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          date: string
          household_id: string
          id: string
          meal_type: string
          recipe_id: string
          servings: number
          task_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          household_id: string
          id?: string
          meal_type: string
          recipe_id: string
          servings?: number
          task_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          household_id?: string
          id?: string
          meal_type?: string
          recipe_id?: string
          servings?: number
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          chat_messages: boolean
          created_at: string
          digest_hour: number
          id: string
          imbalance_alert: boolean
          morning_digest: boolean
          overdue_alert: boolean
          task_reminder: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_messages?: boolean
          created_at?: string
          digest_hour?: number
          id?: string
          imbalance_alert?: boolean
          morning_digest?: boolean
          overdue_alert?: boolean
          task_reminder?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_messages?: boolean
          created_at?: string
          digest_hour?: number
          id?: string
          imbalance_alert?: boolean
          morning_digest?: boolean
          overdue_alert?: boolean
          task_reminder?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_preferences: {
        Row: {
          created_at: string
          current_split: string | null
          household_type: string | null
          id: string
          main_goal: string | null
          pain_point: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_split?: string | null
          household_type?: string | null
          id?: string
          main_goal?: string | null
          pain_point?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_split?: string | null
          household_type?: string | null
          id?: string
          main_goal?: string | null
          pain_point?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          has_seen_onboarding: boolean
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          has_seen_onboarding?: boolean
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          has_seen_onboarding?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_favorites: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          ingredient_id: string
          note: string | null
          optional: boolean
          quantity: number
          recipe_id: string
          unit: string
        }
        Insert: {
          id?: string
          ingredient_id: string
          note?: string | null
          optional?: boolean
          quantity?: number
          recipe_id: string
          unit?: string
        }
        Update: {
          id?: string
          ingredient_id?: string
          note?: string | null
          optional?: boolean
          quantity?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time: number
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          household_id: string | null
          id: string
          image_url: string | null
          prep_time: number
          servings: number
          source: string
          steps: Json
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          cook_time?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          household_id?: string | null
          id?: string
          image_url?: string | null
          prep_time?: number
          servings?: number
          source?: string
          steps?: Json
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          cook_time?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          household_id?: string | null
          id?: string
          image_url?: string | null
          prep_time?: number
          servings?: number
          source?: string
          steps?: Json
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_list_items: {
        Row: {
          assigned_to: string | null
          category: string | null
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          created_by: string
          id: string
          list_id: string
          position: number
          quantity: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          list_id: string
          position?: number
          quantity?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          list_id?: string
          position?: number
          quantity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shared_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_lists: {
        Row: {
          archived: boolean
          color: string | null
          created_at: string
          created_by: string
          household_id: string
          icon: string | null
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          created_at?: string
          created_by: string
          household_id: string
          icon?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          created_at?: string
          created_by?: string
          household_id?: string
          icon?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completion_ratings: {
        Row: {
          household_id: string
          id: string
          rated_at: string
          rating: number
          task_id: string
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          rated_at?: string
          rating: number
          task_id: string
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          rated_at?: string
          rating?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completion_ratings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completion_ratings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          household_id: string
          id: string
          priority: string
          recurrence: string
          recurrence_parent_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
          zone: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          household_id: string
          id?: string
          priority?: string
          recurrence?: string
          recurrence_parent_id?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
          zone?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          household_id?: string
          id?: string
          priority?: string
          recurrence?: string
          recurrence_parent_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          created_at: string
          household_id: string
          id: string
          logged_at: string
          minutes: number
          note: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          logged_at?: string
          minutes: number
          note?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          logged_at?: string
          minutes?: number
          note?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tlx_entries: {
        Row: {
          created_at: string
          effort: number
          frustration: number
          household_id: string
          id: string
          mental_demand: number
          performance: number
          physical_demand: number
          score: number
          temporal_demand: number
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          effort: number
          frustration: number
          household_id: string
          id?: string
          mental_demand: number
          performance: number
          physical_demand: number
          score: number
          temporal_demand: number
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          effort?: number
          frustration?: number
          household_id?: string
          id?: string
          mental_demand?: number
          performance?: number
          physical_demand?: number
          score?: number
          temporal_demand?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "tlx_entries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tlx_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_seen: {
        Row: {
          id: string
          page: string
          seen_at: string
          user_id: string
          version: number
        }
        Insert: {
          id?: string
          page: string
          seen_at?: string
          user_id: string
          version?: number
        }
        Update: {
          id?: string
          page?: string
          seen_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tour_seen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_slides: {
        Row: {
          body: string
          id: string
          image_key: string | null
          order: number
          page: string
          title: string
          version: number
        }
        Insert: {
          body: string
          id?: string
          image_key?: string | null
          order?: number
          page: string
          title: string
          version?: number
        }
        Update: {
          body?: string
          id?: string
          image_key?: string | null
          order?: number
          page?: string
          title?: string
          version?: number
        }
        Relationships: []
      }
      weekly_objectives: {
        Row: {
          achieved: boolean
          achieved_at: string | null
          baseline_value: number
          created_at: string
          current_value: number
          household_id: string
          id: string
          label: string
          target_value: number
          type: string
          week_start: string
        }
        Insert: {
          achieved?: boolean
          achieved_at?: string | null
          baseline_value: number
          created_at?: string
          current_value?: number
          household_id: string
          id?: string
          label: string
          target_value: number
          type: string
          week_start: string
        }
        Update: {
          achieved?: boolean
          achieved_at?: string | null
          baseline_value?: number
          created_at?: string
          current_value?: number
          household_id?: string
          id?: string
          label?: string
          target_value?: number
          type?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_objectives_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          attention_points: Json
          avg_tlx_score: number | null
          balance_score: number | null
          created_at: string
          generated_at: string
          household_id: string
          id: string
          insights: Json
          member_metrics: Json | null
          model: string
          orientations: Json
          summary: string
          total_minutes_logged: number | null
          total_tasks_completed: number | null
          week_start: string
        }
        Insert: {
          attention_points?: Json
          avg_tlx_score?: number | null
          balance_score?: number | null
          created_at?: string
          generated_at: string
          household_id: string
          id?: string
          insights?: Json
          member_metrics?: Json | null
          model: string
          orientations?: Json
          summary: string
          total_minutes_logged?: number | null
          total_tasks_completed?: number | null
          week_start: string
        }
        Update: {
          attention_points?: Json
          avg_tlx_score?: number | null
          balance_score?: number | null
          created_at?: string
          generated_at?: string
          household_id?: string
          id?: string
          insights?: Json
          member_metrics?: Json | null
          model?: string
          orientations?: Json
          summary?: string
          total_minutes_logged?: number | null
          total_tasks_completed?: number | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_stats: {
        Row: {
          computed_at: string
          expected_share: number
          household_id: string
          id: string
          minutes_delta: number
          minutes_share: number
          minutes_total: number
          tasks_count: number
          tasks_delta: number
          tasks_share: number
          total_minutes_week: number
          total_tasks_week: number
          user_id: string
          week_start: string
        }
        Insert: {
          computed_at?: string
          expected_share?: number
          household_id: string
          id?: string
          minutes_delta?: number
          minutes_share?: number
          minutes_total?: number
          tasks_count?: number
          tasks_delta?: number
          tasks_share?: number
          total_minutes_week?: number
          total_tasks_week?: number
          user_id: string
          week_start: string
        }
        Update: {
          computed_at?: string
          expected_share?: number
          household_id?: string
          id?: string
          minutes_delta?: number
          minutes_share?: number
          minutes_total?: number
          tasks_count?: number
          tasks_delta?: number
          tasks_share?: number
          total_minutes_week?: number
          total_tasks_week?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_stats_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_stats_user_id_fkey"
            columns: ["user_id"]
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
      check_email_registered: { Args: { p_email: string }; Returns: boolean }
      complete_task_with_rating: {
        Args: { p_rating: number; p_task_id: string }
        Returns: undefined
      }
      get_household_by_invite_code: {
        Args: { p_code: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }[]
      }
      get_invite_preview: { Args: { p_token: string }; Returns: Json }
      get_or_create_direct_conversation: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      get_or_create_household_conversation: {
        Args: { p_household_id: string }
        Returns: string
      }
      is_household_member: { Args: { h_id: string }; Returns: boolean }
      join_household_by_token: { Args: { p_token: string }; Returns: Json }
      redeem_invitation_code: { Args: { p_code: string }; Returns: Json }
      refresh_objective_progress: { Args: never; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
