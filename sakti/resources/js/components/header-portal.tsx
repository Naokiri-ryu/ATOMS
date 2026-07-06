import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    children: React.ReactNode;
}

export function HeaderPortal({ children }: Props) {
    const [mounted, setMounted] = useState(false);
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
        const el = document.getElementById('header-actions-portal');
        setTargetElement(el);
    }, []);

    if (!mounted || !targetElement) {
        return null;
    }

    return createPortal(children, targetElement);
}
