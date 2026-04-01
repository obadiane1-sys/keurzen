import { signUpSchema, signInSchema } from '../validation';

// ─── signInSchema ─────────────────────────────────────────────────────────────

describe('signInSchema', () => {
  it('accepts a valid email', () => {
    const result = signInSchema.safeParse({ email: 'user@example.com' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects an invalid email', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'));
      expect(emailError?.message).toBe('Email invalide');
    }
  });

  it('rejects missing email', () => {
    const result = signInSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});

// ─── signUpSchema ─────────────────────────────────────────────────────────────

describe('signUpSchema', () => {
  it('accepts valid email and full_name', () => {
    const result = signUpSchema.safeParse({
      email: 'Alice@Example.com',
      full_name: 'Alice Dupont',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe('Alice Dupont');
    }
  });

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      email: 'bad',
      full_name: 'Alice',
    });

    expect(result.success).toBe(false);
  });

  it('rejects full_name too short (1 char)', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.com',
      full_name: 'A',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('full_name'));
      expect(nameError?.message).toBe('Au moins 2 caractères');
    }
  });

  it('rejects full_name too long (81+ chars)', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.com',
      full_name: 'A'.repeat(81),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('full_name'));
      expect(nameError?.message).toBe('Trop long');
    }
  });

  it('normalizes email to lowercase', () => {
    const result = signUpSchema.safeParse({
      email: 'Alice@EXAMPLE.COM',
      full_name: 'Alice',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('alice@example.com');
    }
  });
});
