import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Box, Edit, Eye, FolderOpen, Plus, Trash2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, Item } from '@/types';

type CategoryWithItems = Category & {
    items_count: number;
    items: Item[];
};

interface Props {
    categories: CategoryWithItems[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kategori', href: '/admin/categories' },
];

const typeBadge: Record<string, string> = {
    peralatan: 'bg-blue-100 text-blue-700',
    komponen:  'bg-purple-100 text-purple-700',
    asset:     'bg-amber-100 text-amber-700',
};

const typeLabel: Record<string, string> = {
    peralatan: 'Alat',
    komponen:  'Komponen',
    asset:     'Asset',
};

export default function CategoriesIndex({ categories }: Props) {
    const [showForm, setShowForm]       = useState(false);
    const [editId, setEditId]           = useState<number | null>(null);
    const [name, setName]               = useState('');
    const [processing, setProcessing]   = useState(false);
    const [viewCategory, setViewCategory] = useState<CategoryWithItems | null>(null);

    const handleCreate = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/admin/categories', { name }, {
            onSuccess: () => { setName(''); setShowForm(false); },
            onFinish:  () => setProcessing(false),
        });
    };

    const handleUpdate = (e: FormEvent) => {
        e.preventDefault();
        if (!editId) return;
        setProcessing(true);
        router.put(`/admin/categories/${editId}`, { name }, {
            onSuccess: () => { setEditId(null); setName(''); },
            onFinish:  () => setProcessing(false),
        });
    };

    const handleDelete = (category: CategoryWithItems) => {
        if (category.items_count > 0) {
            alert('Kategori tidak dapat dihapus karena masih memiliki barang.');
            return;
        }
        if (confirm(`Hapus kategori "${category.name}"?`)) {
            router.delete(`/admin/categories/${category.id}`);
        }
    };

    const startEdit = (category: Category) => {
        setEditId(category.id);
        setName(category.name);
        setShowForm(false);
        setViewCategory(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Kategori" />
            <FlashMessage />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
                        <p className="text-sm text-muted-foreground">Kelola kategori barang inventaris</p>
                    </div>
                    <button
                        onClick={() => { setShowForm(true); setEditId(null); setName(''); }}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Plus className="size-4" />
                        Tambah Kategori
                    </button>
                </div>

                {/* Create/Edit Form */}
                {(showForm || editId !== null) && (
                    <form
                        onSubmit={editId ? handleUpdate : handleCreate}
                        className="flex items-end gap-3 rounded-xl border bg-card p-4 shadow-sm"
                    >
                        <div className="flex-1">
                            <label className="mb-1.5 block text-sm font-medium">
                                {editId ? 'Edit Kategori' : 'Nama Kategori Baru'}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="contoh: Alat Kelistrikan"
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setEditId(null); setName(''); }}
                            className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                        >
                            Batal
                        </button>
                    </form>
                )}

                {/* Categories List */}
                <div className="rounded-xl border bg-card shadow-sm">
                    {categories.length === 0 ? (
                        <div className="p-12 text-center">
                            <FolderOpen className="mx-auto size-12 text-muted-foreground/30" />
                            <p className="mt-3 text-muted-foreground">Belum ada kategori.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                            <FolderOpen className="size-5 text-primary" />
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => setViewCategory(category)}
                                                className="font-medium hover:text-primary hover:underline text-left"
                                            >
                                                {category.name}
                                            </button>
                                            <p className="text-xs text-muted-foreground">
                                                {category.items_count} barang
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setViewCategory(category)}
                                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                            title="Lihat isi kategori"
                                        >
                                            <Eye className="size-4" />
                                        </button>
                                        <button
                                            onClick={() => startEdit(category)}
                                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                            title="Edit kategori"
                                        >
                                            <Edit className="size-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            className="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                                            title="Hapus kategori"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* View Category Sheet */}
            <Sheet open={viewCategory !== null} onOpenChange={(open) => { if (!open) setViewCategory(null); }}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle className="flex items-center gap-2 text-lg">
                            <FolderOpen className="size-5 text-primary" />
                            {viewCategory?.name}
                        </SheetTitle>
                        <p className="text-sm text-muted-foreground">
                            {viewCategory?.items_count ?? 0} barang dalam kategori ini
                        </p>
                    </SheetHeader>

                    {viewCategory?.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Box className="size-12 text-muted-foreground/30" />
                            <p className="mt-3 text-sm text-muted-foreground">Belum ada barang di kategori ini.</p>
                            <Link
                                href="/admin/items/create"
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                <Plus className="size-3.5" /> Tambah Barang
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {viewCategory?.items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-lg border p-4 transition-colors hover:bg-muted/30 ${
                                        item.is_low_stock
                                            ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/10'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link
                                                    href={`/admin/items/${item.id}`}
                                                    className="font-medium hover:text-primary hover:underline text-sm truncate"
                                                >
                                                    {item.name}
                                                </Link>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeBadge[item.type] ?? 'bg-slate-100 text-slate-600'}`}>
                                                    {typeLabel[item.type] ?? item.type}
                                                </span>
                                                {item.is_low_stock && (
                                                    <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        <AlertTriangle className="size-2.5" /> Stok Menipis
                                                    </span>
                                                )}
                                            </div>
                                            {item.product_number && (
                                                <p className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                                                    PN: {item.product_number}
                                                </p>
                                            )}
                                            {item.serial_number && (
                                                <p className="text-[11px] text-muted-foreground font-mono">
                                                    SN: {item.serial_number}
                                                </p>
                                            )}
                                        </div>
                                        <Link
                                            href={`/admin/items/${item.id}`}
                                            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                            title="Lihat detail"
                                        >
                                            <Eye className="size-4" />
                                        </Link>
                                    </div>

                                    {/* Stock bar */}
                                    <div className="mt-3">
                                        <div className="mb-1 flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Stok tersedia</span>
                                            <span className={`font-bold ${item.available_quantity === 0 ? 'text-red-600' : item.is_low_stock ? 'text-amber-600' : 'text-green-600'}`}>
                                                {item.available_quantity} / {item.quantity}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    item.available_quantity === 0
                                                        ? 'bg-red-500'
                                                        : item.is_low_stock
                                                            ? 'bg-amber-400'
                                                            : 'bg-green-500'
                                                }`}
                                                style={{
                                                    width: item.quantity > 0
                                                        ? `${Math.min(100, (item.available_quantity / item.quantity) * 100)}%`
                                                        : '0%',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer action */}
                    <div className="mt-6 border-t pt-4">
                        <Link
                            href={`/admin/items?category_id=${viewCategory?.id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                        >
                            <Box className="size-4" />
                            Lihat Semua di Halaman Barang
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
