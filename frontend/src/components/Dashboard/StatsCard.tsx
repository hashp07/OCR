import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("p-6 glass transition-all duration-200 hover:shadow-lg", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              changeType === 'positive' && "text-success",
              changeType === 'negative' && "text-destructive",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}