import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    variant?: 'default' | 'warning' | 'danger' | 'info';
}

export function StatCard({ title, value, icon: Icon, description, variant = 'default' }: StatCardProps) {
    const variantStyles = {
        default: 'border-border bg-card',
        warning: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950',
        danger: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
        info: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
    };

    const iconStyles = {
        default: 'bg-primary/10 text-primary',
        warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
        danger: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
        info: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    };

    return (
        <div className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md sm:p-5 ${variantStyles[variant]}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <p className="break-words text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
                    {description && (
                        <p className="break-words text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-12 ${iconStyles[variant]}`}>
                    <Icon className="size-5 sm:size-6" />
                </div>
            </div>
        </div>
    );
}
