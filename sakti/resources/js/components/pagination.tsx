import { Link } from '@inertiajs/react';
import type { PaginatedResponse } from '@/types/models';

interface PaginationProps<T> {
    data: PaginatedResponse<T>;
}

export function Pagination<T>({ data }: PaginationProps<T>) {
    if (data.last_page <= 1) return null;

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <p className="text-sm text-muted-foreground">
                Menampilkan {data.from ?? 0} - {data.to ?? 0} dari {data.total} data
            </p>
            <div className="flex items-center gap-1">
                {data.links.map((link, index) => (
                    <Link
                        key={index}
                        href={link.url || '#'}
                        preserveScroll
                        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${link.active
                                ? 'bg-primary text-primary-foreground'
                                : link.url
                                    ? 'hover:bg-accent'
                                    : 'cursor-not-allowed text-muted-foreground/40'
                            }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
