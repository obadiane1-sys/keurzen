/**
 * Tests unitaires — validations Zod
 */

import { signUpSchema, taskSchema, budgetExpenseSchema } from '../utils/validation';

describe('signUpSchema', () => {
  it('accepts valid signup data', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      full_name: 'Test User',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      email: 'not-an-email',
      full_name: 'Test User',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too-short full_name', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      full_name: 'A',
    });
    expect(result.success).toBe(false);
  });
});

describe('taskSchema', () => {
  it('rejects task with empty title', () => {
    const result = taskSchema.safeParse({
      title: '',
      category: 'cleaning',
      zone: 'general',
      priority: 'medium',
      recurrence: 'none',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid task', () => {
    const result = taskSchema.safeParse({
      title: 'Faire la vaisselle',
      category: 'cleaning',
      zone: 'kitchen',
      priority: 'low',
      recurrence: 'daily',
    });
    expect(result.success).toBe(true);
  });
});

describe('budgetExpenseSchema', () => {
  it('rejects negative amount', () => {
    const result = budgetExpenseSchema.safeParse({
      amount: '-10',
      category: 'groceries',
      paid_by: '00000000-0000-0000-0000-000000000000',
      date: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid expense', () => {
    const result = budgetExpenseSchema.safeParse({
      amount: '25.50',
      category: 'groceries',
      paid_by: '00000000-0000-0000-0000-000000000000',
      date: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });
});
