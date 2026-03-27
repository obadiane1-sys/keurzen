/**
 * Tests unitaires — validations Zod
 */

import { passwordSchema, signUpSchema, taskSchema, budgetExpenseSchema } from '../utils/validation';

describe('passwordSchema', () => {
  it('accepts valid strong password', () => {
    const result = passwordSchema.safeParse('MyP@ssw0rd!2024');
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 12 chars', () => {
    const result = passwordSchema.safeParse('Short!1');
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    const result = passwordSchema.safeParse('mypassword1!ok');
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = passwordSchema.safeParse('MyPassword!ok');
    expect(result.success).toBe(false);
  });

  it('rejects password without special char', () => {
    const result = passwordSchema.safeParse('MyPassword12ok');
    expect(result.success).toBe(false);
  });

  it('rejects password with spaces', () => {
    const result = passwordSchema.safeParse('My P@ssw0rd 123');
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      full_name: 'Test User',
      password: 'MyP@ssw0rd!2024',
      confirmPassword: 'DifferentP@ss1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword');
    }
  });

  it('accepts valid signup data', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      full_name: 'Test User',
      password: 'MyP@ssw0rd!2024',
      confirmPassword: 'MyP@ssw0rd!2024',
    });
    expect(result.success).toBe(true);
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
