import { Wrench } from 'lucide-react';

export default function AppLogoIcon({ className }: { className?: string }) {
    return <Wrench className={className || 'size-5 fill-primary text-primary-foreground'} />;
}
