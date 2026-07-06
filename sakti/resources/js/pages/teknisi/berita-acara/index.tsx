import { Head, router, useForm } from '@inertiajs/react';
import { Download, FileCheck, FileUp, Filter, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { Pagination } from '@/components/pagination';
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
    { title: 'Berita Acara', href: '/teknisi/berita-acara' },
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

export default function TeknisiBeritaAcaraIndex({ beritaAcara, filters, canDelete }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showUpload, setShowUpload] = useState(false);

    const form = useForm({
        title: '',
        type: 'pemasangan' as 'pemasangan' | 'pelepasan' | 'serah_terima',
        description: '',
        file: null as File | null,
    });

    const applyFilters = () => {
        router.get('/teknisi/berita-acara', {
            search: search || undefined,
            type: filters.type || undefined,
        }, { preserveState: true });
    };

    const handleTypeFilter = (type: string) => {
        router.get('/teknisi/berita-acara', {
            search: filters.search || undefined,
            type: type || undefined,
        }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/teknisi/berita-acara', {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setShowUpload(false);
            },
        });
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
                            Upload dan lihat berita acara pemasangan, pelepasan, dan serah terima asset
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

                {/* Upload Form */}
                {showUpload && (
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-xl border bg-card p-4 shadow-sm sm:p-6"
                    >
                        <h3 className="mb-4 text-lg font-semibold">Upload Berita Acara Baru</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Judul <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    placeholder="Judul berita acara..."
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {form.errors.title && <p className="mt-1 text-xs text-red-500">{form.errors.title}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Jenis <span className="text-red-500">*</span></label>
                                <select
                                    value={form.data.type}
                                    onChange={(e) => form.setData('type', e.target.value as 'pemasangan' | 'pelepasan' | 'serah_terima')}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {typeOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {form.errors.type && <p className="mt-1 text-xs text-red-500">{form.errors.type}</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium">Deskripsi / Catatan</label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Catatan tambahan (opsional)..."
                                    rows={3}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                {form.errors.description && <p className="mt-1 text-xs text-red-500">{form.errors.description}</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium">File <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-3">
                                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors hover:border-primary hover:bg-primary/5">
                                        <FileUp className="size-5 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            {form.data.file ? form.data.file.name : 'Pilih file (PDF, Word — max 2MB)'}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                                        />
                                    </label>
                                </div>
                                {form.errors.file && <p className="mt-1 text-xs text-red-500">{form.errors.file}</p>}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                <FileCheck className="size-4" />
                                {form.processing ? 'Mengupload...' : 'Upload'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex-1 min-w-[200px]">
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cari</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari judul berita acara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                    <div className="min-w-[180px]">
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Jenis</label>
                        <select
                            value={filters.type || ''}
                            onChange={(e) => handleTypeFilter(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Semua Jenis</option>
                            {typeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={applyFilters}
                        className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                    >
                        <Filter className="size-4" />
                        Filter
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
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Judul</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center font-medium">Jenis</th>
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
                                                        href={`/teknisi/berita-acara/${ba.id}/download`}
                                                        className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                                        title="Download"
                                                    >
                                                        <Download className="size-4" />
                                                    </a>
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
