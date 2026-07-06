import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Box, Eye, Filter, Search, Trash2, User } from 'lucide-react';
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

interface UserOption {
    id: number;
    name: string;
}

interface Props {
    borrowings: PaginatedResponse<Borrowing>;
    users: UserOption[];
    filters: {
        status?: string;
        search?: string;
        user_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Peminjaman', href: '/admin/borrowings' },
];

export default function AdminBorrowingsIndex({ borrowings, users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/borrowings', { ...filters, search }, { preserveScroll: true });
    };

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value || undefined };
        router.get('/admin/borrowings', newFilters, { preserveScroll: true });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus log peminjaman ini? Stok barang akan dikembalikan jika masih berstatus dipinjam.')) return;
        router.delete(`/admin/borrowings/${id}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Peminjaman" />
            <FlashMessage />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                <div>
                    <h1 className="text-2xl font-bold">Manajemen Peminjaman</h1>
                    <p className="text-sm text-muted-foreground">Lihat detail dan kelola semua log peminjaman</p>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <table className="min-w-[860px] w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
                                                Peminjam
                                                <Filter className={`size-3 ${filters.user_id ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-56">
                                                <DropdownMenuLabel>Filter Teknisi</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleFilter('user_id', '')} className={!filters.user_id ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Semua Teknisi
                                                </DropdownMenuItem>
                                                {users.map(u => (
                                                    <DropdownMenuItem key={u.id} onClick={() => handleFilter('user_id', u.id.toString())} className={filters.user_id === u.id.toString() ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                        {u.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
                                                Barang
                                                <Filter className={`size-3 ${filters.search ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-64 p-3">
                                                <form onSubmit={handleSearch} className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                                        <input
                                                            type="text"
                                                            value={search}
                                                            onChange={(e) => setSearch(e.target.value)}
                                                            placeholder="Cari barang..."
                                                            className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                    <Button type="submit" size="sm" className="h-auto py-1.5 px-3">Cari</Button>
                                                </form>
                                                {filters.search && (
                                                    <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-7" onClick={() => { setSearch(''); handleFilter('search', ''); }}>
                                                        Reset Pencarian
                                                    </Button>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium">Qty</th>
                                    <th className="px-4 py-3 text-left font-medium">Waktu Pinjam</th>
                                    <th className="px-4 py-3 text-left font-medium">Waktu Kembali</th>
                                    <th className="px-4 py-3 text-center font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center justify-center gap-1 w-full hover:text-primary transition-colors focus:outline-none">
                                                Status
                                                <Filter className={`size-3 ${filters.status ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="center" className="w-48">
                                                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleFilter('status', '')} className={!filters.status ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Semua Status
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleFilter('status', 'dipinjam')} className={filters.status === 'dipinjam' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Dipinjam
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleFilter('status', 'dikembalikan')} className={filters.status === 'dikembalikan' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Dikembalikan
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleFilter('status', 'digunakan')} className={filters.status === 'digunakan' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Digunakan (Habis Pakai)
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {borrowings.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                            Tidak ada data peminjaman ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    borrowings.data.map((b) => (
                                        <tr key={b.id} className={`border-b transition-colors hover:bg-muted/30 ${b.is_overdue ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        <User className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{b.user?.name}</p>
                                                        <p className="text-xs text-muted-foreground">{b.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Box className="size-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{b.item?.name}</p>
                                                        <p className="text-xs text-muted-foreground">{b.item?.category?.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium">{b.quantity}</td>
                                            <td className="px-4 py-3 text-xs">{new Date(b.borrowed_at).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 text-xs">
                                                {b.returned_at ? new Date(b.returned_at).toLocaleString('id-ID') : <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {b.is_overdue && <AlertTriangle className="size-3 text-red-500" />}
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        b.status === 'digunakan'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : b.status === 'dipinjam'
                                                                ? b.is_overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {b.status === 'digunakan'
                                                            ? 'Digunakan'
                                                            : b.status === 'dipinjam'
                                                                ? (b.is_overdue ? 'Terlambat' : 'Dipinjam')
                                                                : 'Dikembalikan'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={`/admin/borrowings/${b.id}`}
                                                        className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(b.id)}
                                                        className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                                                        title="Hapus Log"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination data={borrowings} />
            </div>
        </AppLayout>
    );
}
