import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, Edit, Eye, FileSpreadsheet, FileText, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import type { BreadcrumbItem, Category, Item, PaginatedResponse } from '@/types';

interface Props {
    items: PaginatedResponse<Item>;
    categories: Category[];
    filters: {
        type?: string;
        search?: string;
        category_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Barang', href: '/admin/items' },
];

export default function ItemsIndex({ items, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category_id || '');
    const [excelOpen, setExcelOpen] = useState(false);
    const [pdfOpen, setPdfOpen] = useState(false);
    const excelRef = useRef<HTMLDivElement>(null);
    const pdfRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (excelRef.current && !excelRef.current.contains(e.target as Node)) setExcelOpen(false);
            if (pdfRef.current && !pdfRef.current.contains(e.target as Node)) setPdfOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const applyFilters = () => {
        router.get('/admin/items', {
            search: search || undefined,
            type: typeFilter || undefined,
            category_id: categoryFilter || undefined,
        }, { preserveState: true });
    };

    const handleDelete = (item: Item) => {
        if (confirm(`Hapus barang "${item.name}"?`)) {
            router.delete(`/admin/items/${item.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Barang" />
            <FlashMessage />
            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Manajemen Barang</h1>
                        <p className="text-sm text-muted-foreground">Kelola inventaris peralatan dan komponen</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Excel Export Dropdown */}
                        <div className="relative" ref={excelRef}>
                            <button
                                onClick={() => { setExcelOpen(!excelOpen); setPdfOpen(false); }}
                                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                            >
                                <FileSpreadsheet className="size-4 text-green-600" />
                                Excel
                                <ChevronDown className="size-3 text-muted-foreground" />
                            </button>
                            {excelOpen && (
                                <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border bg-popover p-1 shadow-lg">
                                    <a
                                        href="/admin/items-export/excel?type=asset"
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                                        onClick={() => setExcelOpen(false)}
                                    >
                                        <span className="size-2 rounded-full bg-amber-500" />
                                        Data Asset
                                    </a>
                                    <a
                                        href="/admin/items-export/excel?type=equipment"
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                                        onClick={() => setExcelOpen(false)}
                                    >
                                        <span className="size-2 rounded-full bg-blue-500" />
                                        Data Peralatan &amp; Komponen
                                    </a>
                                    <div className="my-1 border-t" />
                                    <a
                                        href="/admin/items-export/excel"
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                                        onClick={() => setExcelOpen(false)}
                                    >
                                        <span className="size-2 rounded-full bg-gray-400" />
                                        Semua Barang
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* PDF Export Dropdown */}
                        <div className="relative" ref={pdfRef}>
                            <button
                                onClick={() => { setPdfOpen(!pdfOpen); setExcelOpen(false); }}
                                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                            >
                                <FileText className="size-4 text-red-600" />
                                PDF
                                <ChevronDown className="size-3 text-muted-foreground" />
                            </button>
                            {pdfOpen && (
                                <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border bg-popover p-1 shadow-lg">
                                    <a
                                        href="/admin/items-export/pdf?type=asset"
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                                        onClick={() => setPdfOpen(false)}
                                    >
                                        <span className="size-2 rounded-full bg-amber-500" />
                                        Data Asset
                                    </a>
                                    <a
                                        href="/admin/items-export/pdf?type=equipment"
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                                        onClick={() => setPdfOpen(false)}
                                    >
                                        <span className="size-2 rounded-full bg-blue-500" />
                                        Data Peralatan &amp; Komponen
                                    </a>
                                    <div className="my-1 border-t" />
                                    <a
                                        href="/admin/items-export/pdf"
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                                        onClick={() => setPdfOpen(false)}
                                    >
                                        <span className="size-2 rounded-full bg-gray-400" />
                                        Semua Barang
                                    </a>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/admin/items/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            <Plus className="size-4" />
                            Tambah Barang
                        </Link>
                    </div>
                </div>

                {/* Items Table */}
                {items.data.length === 0 ? (
                    <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                        <p className="text-muted-foreground">Belum ada barang.</p>
                        <Link
                            href="/admin/items/create"
                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                            <Plus className="size-3" />
                            Tambah barang pertama
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                            <table className="min-w-[880px] w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">No</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Nama Barang</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Part Number</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Kode SAKTI</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Serial No.</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Kategori</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center font-medium">Jenis</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center font-medium">Tersedia</th>
                                        <th className="whitespace-nowrap px-4 py-3 text-center font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.data.map((item, idx) => {
                                        const borrowed = item.quantity - item.available_quantity;
                                        return (
                                            <tr key={item.id} className="border-b transition-colors hover:bg-muted/30">
                                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                                    {(items.current_page - 1) * items.per_page + idx + 1}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-medium">
                                                    {item.name}
                                                    {item.is_low_stock && (
                                                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-600 dark:bg-red-950 dark:text-red-400">
                                                            Low
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {item.product_number ? (
                                                        <span className="font-mono text-xs">{item.product_number}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{item.code_unique}</span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    {item.serial_number ? (
                                                        <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">{item.serial_number}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{item.category?.name}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-center">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        item.type === 'peralatan'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                            : item.type === 'asset'
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-center">
                                                    <div className="flex flex-col">
                                                        <span className={`font-black ${item.available_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {item.available_quantity}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">dari {item.quantity}</span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={`/admin/items/${item.id}`}
                                                            className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                                                            title="Detail & QR Code"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Link>
                                                        <Link
                                                            href={`/admin/items/${item.id}/edit`}
                                                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                                            title="Edit"
                                                        >
                                                            <Edit className="size-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <Pagination data={items} />
            </div>
        </AppLayout>
    );
}
