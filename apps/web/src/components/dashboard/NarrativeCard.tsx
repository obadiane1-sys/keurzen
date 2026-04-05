import { Sparkles, AlertCircle, CheckCircle, Hand } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface NarrativeCardProps {
  doneTasks: number;
  overdueTasks: number;
  tlxDelta: number | null;
  hasTlx: boolean;
}

function getNarrative(props: NarrativeCardProps) {
  const { doneTasks, overdueTasks, tlxDelta, hasTlx } = props;

  if (!hasTlx) {
    return {
      title: 'Bienvenue',
      body: 'Remplis le questionnaire TLX pour suivre ta charge mentale cette semaine.',
      Icon: Hand,
    };
  }

  if (tlxDelta !== null && tlxDelta < -5) {
    return {
      title: 'Belle semaine en cours',
      body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} et ta charge mentale a baisse de ${Math.abs(tlxDelta)} points.`,
      Icon: Sparkles,
    };
  }

  if (tlxDelta !== null && tlxDelta > 5) {
    const suffix = overdueTasks > 0
      ? `Il reste ${overdueTasks} tache${overdueTasks > 1 ? 's' : ''} en retard.`
      : 'Prends un moment pour toi.';
    return {
      title: 'Semaine chargee',
      body: `Ta charge mentale a augmente de ${tlxDelta} points. ${suffix}`,
      Icon: AlertCircle,
    };
  }

  return {
    title: 'En bonne voie',
    body: `Tu as complete ${doneTasks} tache${doneTasks > 1 ? 's' : ''} cette semaine. Continue comme ca !`,
    Icon: CheckCircle,
  };
}

export function NarrativeCard(props: NarrativeCardProps) {
  const { title, body, Icon } = getNarrative(props);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={20} className="text-miel shrink-0" />
        <span className="text-sm font-bold text-text-primary flex-1">{title}</span>
        <span className="text-text-muted text-sm">↗</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
    </Card>
  );
}
