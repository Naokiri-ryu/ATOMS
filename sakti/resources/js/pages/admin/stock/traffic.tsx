import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowUpRight, Package, TrendingDown, TrendingUp } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface BorrowedItem {
    id: number;
    name: string;
    type: string;
    borrow_count: number;
}

interface InstalledItem {
    id: number;
    name: string;
    type: string;
    install_count: number;
}

interface LeastUsedItem {
    id: number;
    name: string;
    type: string;
    total_usage: number;
}

interface LowStockItem {
    id: number;
    name: string;
    type: string;
    quantity: number;
    min_stock: number;
    available_quantity: number;
    category: string | null;
}

interface Stats {
    totalItems: number;
    totalBorrowed: number;
    totalInstalled: number;
    totalLowStock: number;
    pendingApprovals: number;
}

interface Props {
    mostBorrowed: BorrowedItem[];
    mostInstalled: InstalledItem[];
    leastUsed: LeastUsedItem[];
    lowStock: LowStockItem[];
    stats: Stats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Analitik Traffic Stok', href: '/admin/stock/traffic' },
];

export default function StockTraffic({ mostBorrowed, mostInstalled, leastUsed, lowStock, stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analitik Traffic Stok" />
            <FlashMessage />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analitik Traffic Stok</h2>
                    <p className="text-muted-foreground">
                        Wawasan penggunaan barang dan peringatan stok menipis secara real-time.
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                        { label: 'Total Barang', value: stats.totalItems },
                        { label: 'Sedang Dipinjam', value: stats.totalBorrowed },
                        { label: 'Terpasang', value: stats.totalInstalled },
                        { label: 'Stok Menipis', value: stats.totalLowStock },
                        { label: 'Pending Approval', value: stats.pendingApprovals },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
                            <p className="text-2xl font-black">{s.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Most Borrowed (Peralatan) */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="size-5 text-blue-500" />
                            Peralatan Paling Sering Dipinjam
                        </h3>
                        <div className="space-y-3">
                            {mostBorrowed.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data peminjaman.</p>
                            ) : (
                                mostBorrowed.map((item, index) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/30">
                                                #{index + 1}
                                            </div>
                                            <Link href={`/admin/items/${item.id}`} className="font-medium hover:underline text-sm">
                                                {item.name}
                                            </Link>
                                        </div>
                                        <span className="flex items-center gap-1 text-sm font-black text-blue-600">
                                            <ArrowUpRight className="size-3" /> {item.borrow_count}x
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Most Installed (Komponen + Asset) */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="size-5 text-purple-500" />
                            Komponen/Asset Paling Sering Dipasang
                        </h3>
                        <div className="space-y-3">
                            {mostInstalled.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data pemasangan.</p>
                            ) : (
                                mostInstalled.map((item, index) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600 dark:bg-purple-900/30">
                                                #{index + 1}
                                            </div>
                                            <Link href={`/admin/items/${item.id}`} className="font-medium hover:underline text-sm">
                                                {item.name}
                                            </Link>
                                        </div>
                                        <span className="flex items-center gap-1 text-sm font-black text-purple-600">
                                            <ArrowUpRight className="size-3" /> {item.install_count}x
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="rounded-xl border border-amber-200 bg-card p-5 shadow-sm dark:border-amber-900/30">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertTriangle className="size-5 text-amber-500" />
                                Peringatan Stok Menipis
                            </h3>
                            {lowStock.length > 0 && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    {lowStock.length} BARANG
                                </span>
                            )}
                        </div>
                        <div className="space-y-3">
                            {lowStock.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm font-bold text-green-600 uppercase">Stok Aman</p>
                                    <p className="text-xs text-muted-foreground">Semua barang di atas ambang batas minimum.</p>
                                </div>
                            ) : (
                                lowStock.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/20 dark:bg-amber-950/10">
                                        <div>
                                            <Link href={`/admin/items/${item.id}`} className="font-medium hover:underline text-sm">
                                                {item.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">Min: {item.min_stock} unit</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-red-600">{item.available_quantity}</span>
                                            <p className="text-[10px] font-bold text-muted-foreground">SISA</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Least Used */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                            <TrendingDown className="size-5 text-slate-400" />
                            Barang Jarang Digunakan
                        </h3>
                        <div className="space-y-3">
                            {leastUsed.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data.</p>
                            ) : (
                                leastUsed.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 bg-slate-50/50 dark:bg-slate-900/10">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-white dark:bg-black/20">
                                                <Package className="size-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <Link href={`/admin/items/${item.id}`} className="font-medium hover:underline text-sm">
                                                    {item.name}
                                                </Link>
                                                <p className="text-[10px] text-muted-foreground capitalize">{item.type}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground">{item.total_usage}x digunakan</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
