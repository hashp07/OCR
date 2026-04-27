import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo1 from '@/assets/logo2.jpeg';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  FileText, 
  Settings, 
  Search,
  Menu,
  X,
  MoreVertical // <-- Added MoreVertical icon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: { username?: string; email?: string } | null;
  onLogout?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload & OCR', icon: Upload },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onPageChange, user, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Floating Toggle Button - Moved to top-right with vertical dots */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 right-4 z-40 bg-[#0a0a0a] border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
        onClick={() => setIsMobileOpen(true)}
      >
        <MoreVertical className="w-5 h-5 text-white" />
      </Button>

      {/* Mobile Dark Overlay - Appears when sidebar is open on phone */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "glass border-r transition-all duration-300 ease-in-out h-screen",
        // Mobile: Fixed position, sliding off-screen to the left
        "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop widths
        isCollapsed ? "md:w-16" : "md:w-64",
        // Mobile width (always 64 when open)
        "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              
              {/* Logo */}
              <div className={cn("flex items-center space-x-2", isCollapsed ? "hidden md:hidden" : "")}>
                
                  <img 
                    src={logo1} 
                    alt="OCRIQ Logo" 
                    className="h-10 sm:h-12 md:h-14 w-auto object-contain pb-1 cursor-pointer"
                  />
                
              </div>
              
              {/* Desktop Toggle Collapse Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:flex transition-colors"
              >
                {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </Button>

              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              const showText = !isCollapsed || isMobileOpen;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    isActive && "bg-[#8d5df5] hover:bg-[#d946ef] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]",
                    showText && "px-4",
                    !showText && "px-0 md:justify-center"
                  )}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMobileOpen(false); 
                  }}
                >
                  <Icon className={cn("w-4 h-4", showText && "mr-3")} />
                  {showText && <span>{item.label}</span>}
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="p-4 border-t border-border/50">
              <div className="glass rounded-lg p-3 bg-black/20 border border-white/5">
                <div className="text-sm text-muted-foreground">
                  <div className="font-bold text-white">{user?.username || 'User'}</div>
                  <div className="truncate text-xs">{user?.email || '—'}</div>
                </div>
                {onLogout && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                    onClick={onLogout}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}