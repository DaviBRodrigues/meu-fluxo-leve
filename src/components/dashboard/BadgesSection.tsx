import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useBadges, Badge } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

function BadgeItem({ badge }: { badge: Badge }) {
  const progressPct = badge.maxProgress ? (badge.progress! / badge.maxProgress) * 100 : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        badge.earned
          ? 'bg-primary/5 border-primary/20'
          : 'bg-muted/30 border-border opacity-60'
      )}
    >
      <span className="text-2xl">{badge.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', badge.earned && 'text-primary')}>
          {badge.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
        {!badge.earned && badge.maxProgress && (
          <div className="mt-1.5">
            <Progress value={progressPct} className="h-1" />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {badge.progress}/{badge.maxProgress}
            </p>
          </div>
        )}
      </div>
      {badge.earned && <span className="text-xs font-medium text-primary">✓</span>}
    </div>
  );
}

export default function BadgesSection() {
  const { earnedBadges, pendingBadges } = useBadges();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Conquistas
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {earnedBadges.length} desbloqueadas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {earnedBadges.map(badge => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
          {pendingBadges.slice(0, 4).map(badge => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
