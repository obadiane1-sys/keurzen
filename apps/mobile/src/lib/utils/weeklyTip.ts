/**
 * Weekly Tip — pure conditional logic, no LLM
 *
 * Picks the most relevant actionable tip based on the current household state.
 * Priority order: overdue > high TLX > imbalance > low progress > streak > default
 */

export interface WeeklyTipInput {
  overdueCount: number;
  tlxScore: number | null;
  balancePercent: number;
  weeklyProgress: number;
  streakDays: number;
  memberCount: number;
}

export interface WeeklyTip {
  icon: string;
  title: string;
  body: string;
  color: 'rose' | 'prune' | 'miel' | 'sauge' | 'terracotta';
}

export function computeWeeklyTip(input: WeeklyTipInput): WeeklyTip {
  const { overdueCount, tlxScore, balancePercent, weeklyProgress, streakDays, memberCount } = input;

  // 1. Overdue tasks — urgent
  if (overdueCount >= 3) {
    return {
      icon: 'alert-circle',
      title: 'Taches en retard',
      body: `${overdueCount} taches sont en retard. Prenez 10 minutes pour les replanifier ou les deleguer.`,
      color: 'rose',
    };
  }

  // 2. High mental load
  if (tlxScore != null && tlxScore >= 70) {
    return {
      icon: 'brain',
      title: 'Charge mentale elevee',
      body: 'Votre charge mentale est elevee. Essayez de deleguer une tache recurrente ou de simplifier votre routine cette semaine.',
      color: 'prune',
    };
  }

  // 3. Imbalance — one person does too much (for multi-member households)
  if (memberCount >= 2 && (balancePercent >= 70 || balancePercent <= 30)) {
    return {
      icon: 'scale',
      title: 'Repartition desequilibree',
      body: 'La repartition des taches est inegale. Discutez ensemble de la charge de chacun et redistribuez si besoin.',
      color: 'miel',
    };
  }

  // 4. Some overdue tasks (fewer than 3)
  if (overdueCount > 0) {
    return {
      icon: 'time',
      title: 'Quelques retards',
      body: `${overdueCount} tache${overdueCount > 1 ? 's' : ''} en retard. Un petit coup de pouce aujourd'hui peut remettre la semaine sur les rails.`,
      color: 'miel',
    };
  }

  // 5. Low weekly progress
  if (weeklyProgress < 30 && weeklyProgress > 0) {
    return {
      icon: 'trending-up',
      title: 'Debut de semaine calme',
      body: 'La semaine demarre doucement. Choisissez 2-3 taches prioritaires pour prendre de l\'avance.',
      color: 'terracotta',
    };
  }

  // 6. Great streak
  if (streakDays >= 5) {
    return {
      icon: 'flame',
      title: 'Belle regularite !',
      body: `${streakDays} jours consecutifs d'activite. Continuez comme ca, votre foyer fonctionne au top !`,
      color: 'sauge',
    };
  }

  // 7. Good progress
  if (weeklyProgress >= 70) {
    return {
      icon: 'checkmark-circle',
      title: 'Bonne dynamique',
      body: 'Plus de 70% des taches sont faites. Profitez du reste de la semaine pour souffler un peu.',
      color: 'sauge',
    };
  }

  // 8. Moderate TLX
  if (tlxScore != null && tlxScore >= 50) {
    return {
      icon: 'leaf',
      title: 'Pensez a vous',
      body: 'Votre charge mentale est moderee. Un moment de pause ou une tache en moins peut faire la difference.',
      color: 'prune',
    };
  }

  // 9. Default — everything is fine
  return {
    icon: 'sunny',
    title: 'Tout roule !',
    body: 'Votre foyer est bien organise cette semaine. Profitez-en pour planifier la semaine prochaine.',
    color: 'sauge',
  };
}
