import { Head, router } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Calendar, Filter } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Borrowing, PaginatedResponse } from '@/types';

interface Props {
    movements: PaginatedResponse<Borrowing>;
    filters: {
        date_from?: string;
        date_to?: string;
        type?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Audit Stok', href: '/admin/audit' },
];

export default function AuditIndex({ movements, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');

    const applyFilters = () => {
        router.get('/admin/audit', {
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            type: typeFilter || undefined,
        }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Stok" />
            <FlashMessage />
            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                <div>
                    <h1 className="text-2xl font-bold">Audit Stok</h1>
                    <p className="text-sm text-muted-foreground">Riwayat pergerakan stok barang masuk dan keluar</p>
                </div>

                {/* Movements Table */}
                <div className="rounded-xl border bg-card shadow-sm">
                    {movements.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <Calendar className="mx-auto size-12 text-muted-foreground/30" />
                            <p className="mt-3 text-muted-foreground">Tidak ada data pergerakan stok.</p>
                        </div>
                    ) : (
                        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                            <table className="min-w-[760px] w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="px-5 py-3 font-medium text-muted-foreground">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors focus:outline-none">
                                                    Tipe
                                                    <Filter className={`size-3 ${filters.type ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-48">
                                                    <DropdownMenuLabel>Filter Tipe Pergerakan</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => { setTypeFilter(''); router.get('/admin/audit', { date_from: filters.date_from || undefined, date_to: filters.date_to || undefined }, { preserveState: true }); }} className={!filters.type ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                        Semua Tipe
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setTypeFilter('keluar'); router.get('/admin/audit', { date_from: filters.date_from || undefined, date_to: filters.date_to || undefined, type: 'keluar' }, { preserveState: true }); }} className={filters.type === 'keluar' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                        Keluar (Dipinjam)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setTypeFilter('masuk'); router.get('/admin/audit', { date_from: filters.date_from || undefined, date_to: filters.date_to || undefined, type: 'masuk' }, { preserveState: true }); }} className={filters.type === 'masuk' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                        Masuk (Dikembalikan)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted-foreground">Barang</th>
                                        <th className="px-5 py-3 font-medium text-muted-foreground">Jumlah</th>
                                        <th className="px-5 py-3 font-medium text-muted-foreground">User</th>
                                        <th className="px-5 py-3 font-medium text-muted-foreground">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors focus:outline-none">
                                                    Waktu Pinjam
                                                    <Filter className={`size-3 ${(filters.date_from || filters.date_to) ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-72 p-4">
                                                    <div className="space-y-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
                                                            <input
                                                                type="date"
                                                                value={dateFrom}
                                                                onChange={(e) => setDateFrom(e.target.value)}
                                                                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
                                                            <input
                                                                type="date"
                                                                value={dateTo}
                                                                onChange={(e) => setDateTo(e.target.value)}
                                                                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                            />
                                                        </div>
                                                        <Button onClick={applyFilters} size="sm" className="w-full">
                                                            Terapkan Filter
                                                        </Button>
                                                        {(filters.date_from || filters.date_to) && (
                                                            <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => { setDateFrom(''); setDateTo(''); router.get('/admin/audit', { type: filters.type || undefined }, { preserveState: true }); }}>
                                                                Reset Tanggal
                                                            </Button>
                                                        )}
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </th>
                                        <th className="px-5 py-3 font-medium text-muted-foreground">Waktu Kembali</th>
                                        <th className="px-5 py-3 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {movements.data.map((m) => (
                                        <tr key={m.id} className="hover:bg-muted/30">
                                            <td className="px-5 py-3">
                                                {m.status === 'dipinjam' ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-600">
                                                        <ArrowUpRight className="size-4" /> Keluar
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-green-600">
                                                        <ArrowDownLeft className="size-4" /> Masuk
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div>
                                                    <p className="font-medium">{m.item?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{m.item?.category?.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">{m.quantity}</td>
                                            <td className="px-5 py-3">{m.user?.name}</td>
                                            <td className="px-5 py-3 text-xs">
                                                {new Date(m.borrowed_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-5 py-3 text-xs">
                                                {m.returned_at
                                                    ? new Date(m.returned_at).toLocaleString('id-ID')
                                                    : '-'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.status === 'dipinjam'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {m.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <Pagination data={movements} />
                </div>
            </div>
        </AppLayout>
    );
}
