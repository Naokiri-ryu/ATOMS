import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Box, ClipboardCheck, Clock, Package } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import { StatCard } from '@/components/stat-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Borrowing, Item } from '@/types';

interface Props {
    stats: {
        totalItems: number;
        totalQuantity: number;
        activeBorrowings: number;
        overdueCount: number;
        lowStockCount: number;
        pendingInstallationsCount: number;
    };
    overdueBorrowings: Borrowing[];
    recentBorrowings: Borrowing[];
    lowStockItems: Item[];
    pendingInstallations: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function AdminDashboard({ 
    stats, 
    overdueBorrowings, 
    recentBorrowings, 
    lowStockItems, 
    pendingInstallations 
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin" />
            <FlashMessage />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        title="Total Barang"
                        value={stats.totalItems}
                        icon={Box}
                    />
                    <StatCard
                        title="Total Stok"
                        value={stats.totalQuantity}
                        icon={Package}
                    />
                    <StatCard
                        title="Sedang Dipinjam"
                        value={stats.activeBorrowings}
                        icon={Clock}
                        variant={stats.activeBorrowings > 0 ? 'warning' : 'default'}
                    />
                    <StatCard
                        title="Terlambat"
                        value={stats.overdueCount}
                        icon={AlertTriangle}
                        variant={stats.overdueCount > 0 ? 'danger' : 'default'}
                    />
                    <StatCard
                        title="Stok Menipis"
                        value={stats.lowStockCount}
                        icon={AlertTriangle}
                        variant={stats.lowStockCount > 0 ? 'warning' : 'default'}
                    />
                    <StatCard
                        title="Pending Approval"
                        value={stats.pendingInstallationsCount}
                        icon={ClipboardCheck}
                        variant={stats.pendingInstallationsCount > 0 ? 'info' : 'default'}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Pending Approvals */}
                    <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                                <ClipboardCheck className="size-5 shrink-0 text-blue-500" />
                                Menunggu Approval Pemasangan
                            </h3>
                            <Link href="/admin/installations" className="text-sm font-medium text-blue-600 hover:underline">
                                Lihat Semua
                            </Link>
                        </div>
                        {pendingInstallations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada pengajuan menunggu approval.</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingInstallations.map((p) => (
                                    <div key={p.id} className="flex flex-col gap-3 rounded-lg border p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 flex-col">
                                            <span className="break-words font-medium">{p.item?.name}</span>
                                            <span className="text-xs text-muted-foreground">Oleh: {p.user?.name} • Qty: {p.quantity}</span>
                                        </div>
                                        <Link 
                                            href="/admin/installations" 
                                            className="rounded-md bg-blue-50 px-3 py-2 text-center text-xs font-medium text-blue-700 hover:bg-blue-100 sm:py-1 dark:bg-blue-900/30 dark:text-blue-300"
                                        >
                                            Proses
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Low Stock Warning */}
                    <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                                <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                                Peringatan Stok Menipis
                            </h3>
                        </div>
                        {lowStockItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-green-600 dark:text-green-400">Semua stok dalam kondisi aman.</p>
                        ) : (
                            <div className="space-y-3">
                                {lowStockItems.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/30 dark:bg-amber-950/20">
                                        <div className="flex min-w-0 flex-col">
                                            <span className="break-words font-medium">{item.name}</span>
                                            <span className="text-xs text-muted-foreground">Tersedia: <span className="font-bold text-red-600">{item.available_quantity}</span> / Min: {item.min_stock}</span>
                                        </div>
                                        <Link 
                                            href={`/admin/items/${item.id}`}
                                            className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
                                        >
                                            Update Stok
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Overdue Alerts */}
                {overdueBorrowings.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 dark:border-red-900 dark:bg-red-950">
                        <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
                            <AlertTriangle className="size-5" />
                            Barang Terlambat Dikembalikan
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {overdueBorrowings.map((b) => (
                                <div key={b.id} className="flex flex-col gap-2 rounded-lg bg-white/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:bg-black/20">
                                    <div className="flex min-w-0 flex-col">
                                        <span className="break-words text-sm font-medium">{b.user?.name} — {b.item?.name}</span>
                                        <span className="text-xs text-red-600 dark:text-red-400">
                                            Batas: {new Date(b.expected_return_time || '').toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <Link href="/admin/borrowings" className="text-xs font-medium text-red-700 hover:underline">Detail</Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Borrowings */}
                <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                    <h3 className="mb-4 text-lg font-semibold">Log Peminjaman Terakhir</h3>
                    {recentBorrowings.length === 0 ? (
                        <p className="text-muted-foreground">Belum ada peminjaman.</p>
                    ) : (
                        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                            <table className="min-w-[720px] w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium text-muted-foreground">Peminjam</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Barang</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Jumlah</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Waktu Pinjam</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {recentBorrowings.map((b) => (
                                        <tr key={b.id} className="hover:bg-muted/50">
                                            <td className="py-3 font-medium">{b.user?.name}</td>
                                            <td className="py-3">{b.item?.name}</td>
                                            <td className="py-3">{b.quantity}</td>
                                            <td className="py-3 text-muted-foreground">{new Date(b.borrowed_at).toLocaleString('id-ID')}</td>
                                            <td className="py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${b.status === 'dipinjam'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                    }`}>
                                                    {b.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
