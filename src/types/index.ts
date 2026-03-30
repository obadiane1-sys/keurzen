/**
 * Keurzen — Global TypeScript Types
 * Correspond exactement au schéma Supabase
 */

// ─── Auth & Profile ────────────────────────────────────────────────────────────

export interface Profile {
  id: string; // = auth.users.id
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  has_seen_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Household ─────────────────────────────────────────────────────────────────

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type HouseholdRole = 'owner' | 'admin' | 'member';

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  color: string; // hex color from memberColors palette
  joined_at: string;
  // Joined fields
  profile?: Profile;
}

export type InvitationChannel = 'link' | 'email' | 'contacts' | 'code';

export interface Invitation {
  id: string;
  household_id: string;
  invited_by: string;
  email: string | null;
  first_name: string | null;
  token: string;
  channel: InvitationChannel;
  status: 'pending' | 'sent' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
}

// ─── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory =
  | 'cleaning'
  | 'cooking'
  | 'shopping'
  | 'admin'
  | 'children'
  | 'pets'
  | 'garden'
  | 'repairs'
  | 'health'
  | 'finances'
  | 'other';
export type TaskZone =
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'living_room'
  | 'garden'
  | 'garage'
  | 'general'
  | 'outside'
  | 'other';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null; // user_id
  due_date: string | null; // ISO date
  category: TaskCategory;
  zone: TaskZone;
  priority: TaskPriority;
  estimated_minutes: number | null;
  status: TaskStatus;
  recurrence: RecurrenceType;
  recurrence_parent_id: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  assigned_profile?: Profile;
  time_logs?: TimeLog[];
}

// ─── Time Logs ─────────────────────────────────────────────────────────────────

export interface TimeLog {
  id: string;
  task_id: string;
  user_id: string;
  household_id: string;
  minutes: number;
  logged_at: string; // ISO datetime
  note: string | null;
  created_at: string;
  // Joined
  profile?: Profile;
  task?: Task;
}

// ─── NASA-TLX ──────────────────────────────────────────────────────────────────

export interface TlxEntry {
  id: string;
  user_id: string;
  household_id: string;
  week_start: string; // ISO date, Monday of the week
  mental_demand: number; // 0-100
  physical_demand: number; // 0-100
  temporal_demand: number; // 0-100
  performance: number; // 0-100 (inversé dans le score)
  effort: number; // 0-100
  frustration: number; // 0-100
  score: number; // computed global 0-100
  created_at: string;
}

// ─── Weekly Stats & Alerts ─────────────────────────────────────────────────────

export interface WeeklyStat {
  id: string;
  household_id: string;
  user_id: string;
  week_start: string;
  tasks_count: number;
  total_tasks_week: number;
  tasks_share: number; // 0-1
  tasks_delta: number; // share - expected_share
  minutes_total: number;
  total_minutes_week: number;
  minutes_share: number;
  minutes_delta: number;
  expected_share: number; // 1 / nb_members
  computed_at: string;
  // Joined
  profile?: Profile;
}

export type AlertLevel = 'balanced' | 'watch' | 'unbalanced';
export type AlertType = 'task_imbalance' | 'time_imbalance' | 'overload';

export interface Alert {
  id: string;
  household_id: string;
  user_id: string | null; // null = foyer entier
  type: AlertType;
  level: AlertLevel;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ─── Budget ────────────────────────────────────────────────────────────────────

export type BudgetCategory =
  | 'housing'
  | 'energy'
  | 'groceries'
  | 'children'
  | 'transport'
  | 'health'
  | 'leisure'
  | 'subscriptions'
  | 'savings'
  | 'other';

export interface BudgetExpense {
  id: string;
  household_id: string;
  paid_by: string; // user_id
  amount: number; // in cents to avoid float issues
  category: BudgetCategory;
  memo: string | null;
  date: string; // ISO date
  created_at: string;
  updated_at: string;
  // Joined
  paid_by_profile?: Profile;
}

export type SplitMode = 'equal' | 'percentage' | 'fixed';

export interface BudgetSplit {
  id: string;
  household_id: string;
  expense_id: string | null; // null = default split config
  user_id: string;
  mode: SplitMode;
  share: number; // percentage or fixed amount in cents
  created_at: string;
}

// ─── Tour / Onboarding ─────────────────────────────────────────────────────────

export type TourPage = 'welcome' | 'dashboard' | 'household' | 'tlx';

export interface TourSlide {
  id: string;
  page: TourPage;
  version: number;
  order: number;
  title: string;
  body: string;
  image_key: string | null;
}

export interface TourSeen {
  id: string;
  user_id: string;
  page: TourPage;
  version: number;
  seen_at: string;
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  morning_digest: boolean;
  task_reminder: boolean;
  overdue_alert: boolean;
  imbalance_alert: boolean;
  digest_hour: number; // 0-23
  created_at: string;
  updated_at: string;
}

export type InAppNotificationType =
  | 'task_reminder'
  | 'overdue'
  | 'digest'
  | 'imbalance'
  | 'invitation'
  | 'system';

export interface InAppNotification {
  id: string;
  user_id: string;
  household_id: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ─── Invitation Codes ─────────────────────────────────────────────────────────

export interface InvitationCode {
  id: string;
  code: string;
  household_id: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  email: string | null;
  invited_name: string | null;
}

// ─── Utility Types ─────────────────────────────────────────────────────────────

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;
export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface DateRange {
  from: string;
  to: string;
}

// ─── Form Types ────────────────────────────────────────────────────────────────

export interface TaskFormValues {
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  category: TaskCategory;
  zone: TaskZone;
  priority: TaskPriority;
  estimated_minutes?: number;
  recurrence: RecurrenceType;
}

export interface TlxFormValues {
  mental_demand: number;
  physical_demand: number;
  temporal_demand: number;
  performance: number;
  effort: number;
  frustration: number;
}

export interface BudgetExpenseFormValues {
  amount: string; // string for input, parsed to number
  category: BudgetCategory;
  paid_by: string;
  memo?: string;
  date: string;
}

export interface SignUpFormValues {
  email: string;
  full_name: string;
}

export interface SignInFormValues {
  email: string;
}
