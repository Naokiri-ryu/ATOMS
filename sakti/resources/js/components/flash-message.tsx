import { usePage } from '@inertiajs/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FlashMessages } from '@/types/models';

export function FlashMessage() {
    const { flash } = usePage<{ flash: FlashMessages }>().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setMessage({ type: 'success', text: flash.success });
            setVisible(true);
        } else if (flash?.error) {
            setMessage({ type: 'error', text: flash.error });
            setVisible(true);
        }
    }, [flash]);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible || !message) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-top-2 ${message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
            }`}>
            {message.type === 'success' ? (
                <CheckCircle className="size-5 text-green-600" />
            ) : (
                <XCircle className="size-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
            <button onClick={() => setVisible(false)} className="ml-2 text-current opacity-60 hover:opacity-100">&times;</button>
        </div>
    );
}
