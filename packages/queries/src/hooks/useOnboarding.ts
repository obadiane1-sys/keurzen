import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@keurzen/stores';
import { saveOnboardingPreferences, type OnboardingAnswers } from '../services/onboarding.service';
import { markOnboardingSeen } from '../services/auth.service';

export function useSaveOnboarding() {
  const { user, profile, setProfile } = useAuthStore();

  return useMutation({
    mutationFn: async (answers: OnboardingAnswers) => {
      if (!user) throw new Error('Not authenticated');
      await saveOnboardingPreferences(user.id, answers);
      await markOnboardingSeen(user.id);
    },
    onSuccess: () => {
      if (profile) {
        setProfile({ ...profile, has_seen_onboarding: true });
      }
    },
  });
}

export function useSkipOnboarding() {
  const { user, profile, setProfile } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      await markOnboardingSeen(user.id);
    },
    onSuccess: () => {
      if (profile) {
        setProfile({ ...profile, has_seen_onboarding: true });
      }
    },
  });
}
