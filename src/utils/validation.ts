import { z } from 'zod';

// ─── Password Schema ──────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(12, 'Au moins 12 caractères')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .regex(/[^a-zA-Z0-9]/, 'Au moins un caractère spécial')
  .regex(/^\S+$/, 'Pas d\'espaces autorisés');

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const signUpSchema = z
  .object({
    email: z.string().email('Email invalide').toLowerCase(),
    full_name: z.string().min(2, 'Au moins 2 caractères').max(80, 'Trop long'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

// ─── Task Schema ──────────────────────────────────────────────────────────────

export const taskSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200, 'Titre trop long'),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional(),
  category: z.enum([
    'cleaning', 'cooking', 'shopping', 'admin', 'children',
    'pets', 'garden', 'repairs', 'health', 'finances', 'other',
  ]),
  zone: z.enum([
    'kitchen', 'bathroom', 'bedroom', 'living_room',
    'garden', 'garage', 'general', 'outside', 'other',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimated_minutes: z.number().min(1).max(1440).optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'biweekly', 'monthly']),
});

// ─── TLX Schema ───────────────────────────────────────────────────────────────

const tlxDimension = z.number().min(0).max(100);

export const tlxSchema = z.object({
  mental_demand: tlxDimension,
  physical_demand: tlxDimension,
  temporal_demand: tlxDimension,
  performance: tlxDimension,
  effort: tlxDimension,
  frustration: tlxDimension,
});

// ─── Budget Schema ────────────────────────────────────────────────────────────

export const budgetExpenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Montant requis')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Montant invalide'),
  category: z.enum([
    'housing', 'energy', 'groceries', 'children', 'transport',
    'health', 'leisure', 'subscriptions', 'savings', 'other',
  ]),
  paid_by: z.string().uuid('Payeur requis'),
  memo: z.string().max(500).optional(),
  date: z.string().min(1, 'Date requise'),
});

// ─── Household Schema ─────────────────────────────────────────────────────────

export const householdSchema = z.object({
  name: z.string().min(2, 'Au moins 2 caractères').max(80, 'Trop long'),
});

export const joinHouseholdSchema = z.object({
  code: z.string().min(6, 'Code invalide').max(20),
});
