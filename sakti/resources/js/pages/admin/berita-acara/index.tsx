import { Head, router, useForm } from '@inertiajs/react';
import { Download, FileCheck, FileUp, Filter, Plus, Search, Trash2, X } from 'lucide-react';
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
import type { BeritaAcara, BreadcrumbItem, PaginatedResponse } from '@/types';

interface Props {
    beritaAcara: PaginatedResponse<BeritaAcara>;
    filters: {
        type?: string;
        search?: string;
    };
    canDelete: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Berita Acara', href: '/admin/berita-acara' },
];

const typeOptions = [
    { value: 'pemasangan', label: 'Pemasangan', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    { value: 'pelepasan', label: 'Pelepasan', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    { value: 'serah_terima', label: 'Serah Terima Asset', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
];

function getTypeBadge(type: string) {
    const opt = typeOptions.find((t) => t.value === type);
    return opt ? opt.color : 'bg-gray-100 text-gray-700';
}

function getTypeLabel(type: string) {
    const opt = typeOptions.find((t) => t.value === type);
    return opt ? opt.label : type;
}

export default function AdminBeritaAcaraIndex({ beritaAcara, filters, canDelete }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showUpload, setShowUpload] = useState(false);

    const form = useForm({
        title: '',
        type: 'pemasangan' as 'pemasangan' | 'pelepasan' | 'serah_terima',
        description: '',
        file: null as File | null,
    });

    const applyFilters = () => {
        router.get('/admin/berita-acara', {
            search: search || undefined,
            type: filters.type || undefined,
        }, { preserveState: true });
    };

    const handleTypeFilter = (type: string) => {
        router.get('/admin/berita-acara', {
            search: filters.search || undefined,
            type: type || undefined,
        }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/berita-acara', {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setShowUpload(false);
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus berita acara ini?')) {
            router.delete(`/admin/berita-acara/${id}`, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Berita Acara" />
            <FlashMessage />
            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Berita Acara</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola berita acara pemasangan, pelepasan, dan serah terima asset
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        {showUpload ? <X className="size-4" /> : <Plus className="size-4" />}
                        {showUpload ? 'Tutup' : 'Upload Berita Acara'}
                    </button>
                </div>

                {/* Table */}
                {beritaAcara.data.length === 0 ? (
                    <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                        <FileCheck className="mx-auto mb-3 size-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Belum ada berita acara.</p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                            <Plus className="size-3" />
                            Upload berita acara pertama
                        </button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                            <table className="min-w-[760px] w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">No</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
                                                    Judul
                                                    <Filter className={`size-3 ${filters.search ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-64 p-3">
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                                            <input
                                                                type="text"
                                                                value={search}
                                                                onChange={(e) => setSearch(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                                                placeholder="Cari judul..."
                                                                className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                            />
                                                        </div>
                                                        <Button onClick={applyFilters} size="sm" className="h-auto py-1.5 px-3">Cari</Button>
                                                    </div>
                                                    {filters.search && (
                                                        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-7" onClick={() => { setSearch(''); router.get('/admin/berita-acara', { type: filters.type || undefined }, { preserveState: true }); }}>
                                                            Reset Pencarian
                                                        </Button>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center font-medium">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="flex items-center justify-center gap-1 w-full hover:text-primary transition-colors focus:outline-none">
                                                    Jenis
                                                    <Filter className={`size-3 ${filters.type ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="center" className="w-48">
                                                    <DropdownMenuLabel>Filter Jenis</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleTypeFilter('')} className={!filters.type ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                        Semua Jenis
                                                    </DropdownMenuItem>
                                                    {typeOptions.map((opt) => (
                                                        <DropdownMenuItem key={opt.value} onClick={() => handleTypeFilter(opt.value)} className={filters.type === opt.value ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                            {opt.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Diupload Oleh</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">File</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Tanggal</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {beritaAcara.data.map((ba, idx) => (
                                        <tr key={ba.id} className="border-b transition-colors hover:bg-muted/30">
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                                {(beritaAcara.current_page - 1) * beritaAcara.per_page + idx + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{ba.title}</p>
                                                {ba.description && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{ba.description}</p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadge(ba.type)}`}>
                                                    {getTypeLabel(ba.type)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <p className="font-medium">{ba.user?.name}</p>
                                                <p className="text-xs text-muted-foreground">{ba.user?.role === 'admin' ? 'Admin' : 'Teknisi'}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <p className="text-xs text-muted-foreground">{ba.file_name}</p>
                                                <p className="text-xs text-muted-foreground">{ba.formatted_size}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                                                {new Date(ba.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <a
                                                        href={`/admin/berita-acara/${ba.id}/download`}
                                                        className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                                        title="Download"
                                                    >
                                                        <Download className="size-4" />
                                                    </a>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(ba.id)}
                                                            className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <Pagination data={beritaAcara} />
            </div>
        </AppLayout>
    );
}
