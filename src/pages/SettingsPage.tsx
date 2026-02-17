import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, Shield, FileText, Info } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsItems = [
  { icon: Globe, label: 'Language', value: 'English', path: null },
  { icon: Lock, label: 'Change Password', value: '', path: null },
  { icon: Shield, label: 'Privacy Policy', value: '', path: null },
  { icon: FileText, label: 'Terms of Service', value: '', path: null },
  { icon: Info, label: 'About', value: 'v1.0.0', path: null },
];

export const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <main className="px-4 py-4">
        <div className="rounded-xl border bg-card overflow-hidden">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={cn(
                  'flex w-full items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50',
                  index !== settingsItems.length - 1 && 'border-b'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.value && (
                  <span className="text-sm text-muted-foreground">{item.value}</span>
                )}
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Speedy Bites</p>
          <p className="text-xs text-muted-foreground mt-1">Version 1.0.0</p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
