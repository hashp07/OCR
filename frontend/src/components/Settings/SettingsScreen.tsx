import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';

export function SettingsScreen({
  user,
  onLogout,
}: {
  user?: { username?: string; email?: string } | null;
  onLogout?: () => void;
}) {
  return (
    <div className="space-y-6 md:space-y-8 p-2 md:p-0 pb-20 md:pb-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base">Configure your OCR processing preferences.</p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 gradient-primary rounded-full flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-semibold truncate">Account</h3>
                <Badge variant="secondary" className="text-[10px] md:text-xs">Logged in</Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground truncate">Your profile and session controls.</p>
            </div>
          </div>
          
          {onLogout && (
            <Button 
              variant="outline" 
              className="w-full sm:w-auto mt-2 sm:mt-0 h-11 md:h-10" 
              onClick={onLogout}
            >
              Logout
            </Button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-xl md:rounded-lg border p-4 bg-muted/10 overflow-hidden">
            <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">
              Username
            </div>
            <div className="font-medium text-sm md:text-base truncate">
              {user?.username || '—'}
            </div>
          </div>
          <div className="rounded-xl md:rounded-lg border p-4 bg-muted/10 overflow-hidden">
            <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">
              Email
            </div>
            <div className="font-medium text-sm md:text-base break-all">
              {user?.email || '—'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}