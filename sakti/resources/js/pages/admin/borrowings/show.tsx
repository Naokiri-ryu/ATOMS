import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Box, Calendar, Camera, Clock, Trash2, User } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Borrowing } from '@/types';

interface Props {
    borrowing: Borrowing;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Peminjaman', href: '/admin/borrowings' },
    { title: 'Detail', href: '#' },
];

export default function AdminBorrowingShow({ borrowing }: Props) {
    const handleDelete = () => {
        if (!confirm('Apakah Anda yakin ingin menghapus log peminjaman ini?\n\nJika status masih "dipinjam", stok barang akan dikembalikan secara otomatis.')) return;
        router.delete(`/admin/borrowings/${borrowing.id}`);
    };

    const durationHours = borrowing.returned_at
        ? Math.round((new Date(borrowing.returned_at).getTime() - new Date(borrowing.borrowed_at).getTime()) / (1000 * 60 * 60))
        : Math.round((new Date().getTime() - new Date(borrowing.borrowed_at).getTime()) / (1000 * 60 * 60));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Peminjaman #${borrowing.id}`} />
            <FlashMessage />

            <div className="p-4 sm:p-6">
                <div className="mx-auto max-w-3xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/borrowings" className="rounded-lg p-2 transition-colors hover:bg-accent">
                                <ArrowLeft className="size-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold">Detail Peminjaman #{borrowing.id}</h1>
                                <p className="text-sm text-muted-foreground">
                                    Dicatat pada {new Date(borrowing.borrowed_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <Trash2 className="size-4" />
                            Hapus Log
                        </button>
                    </div>

                    {/* Status Banner */}
                    {borrowing.is_overdue && (
                        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/50">
                            <AlertTriangle className="size-6 text-red-500" />
                            <div>
                                <p className="font-semibold text-red-700 dark:text-red-400">TERLAMBAT</p>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Peminjaman ini sudah melewati batas waktu pengembalian ({durationHours} jam).
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Borrower Info */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold">
                                <User className="size-4 text-primary" />
                                Informasi Peminjam
                            </h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <dt className="text-muted-foreground">Nama</dt>
                                    <dd className="font-medium">{borrowing.user?.name}</dd>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <dt className="text-muted-foreground">Email</dt>
                                    <dd className="text-sm">{borrowing.user?.email}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Role</dt>
                                    <dd>
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                            {borrowing.user?.role === 'admin' ? 'Admin' : 'Teknisi'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Item Info */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold">
                                <Box className="size-4 text-primary" />
                                Informasi Barang
                            </h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <dt className="text-muted-foreground">Nama Barang</dt>
                                    <dd className="font-medium">{borrowing.item?.name}</dd>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <dt className="text-muted-foreground">Kategori</dt>
                                    <dd>{borrowing.item?.category?.name}</dd>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <dt className="text-muted-foreground">Kode</dt>
                                    <dd className="font-mono text-xs">{borrowing.item?.code_unique}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Jumlah Pinjam</dt>
                                    <dd className="font-bold">{borrowing.quantity}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Timeline */}
                        <div className="rounded-xl border bg-card p-6 shadow-sm md:col-span-2">
                            <h3 className="mb-4 flex items-center gap-2 font-semibold">
                                <Clock className="size-4 text-primary" />
                                Timeline Peminjaman
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                            <Calendar className="size-4" />
                                        </div>
                                        <div className="mt-1 h-full w-0.5 bg-border" />
                                    </div>
                                    <div className="pb-4">
                                        <p className="font-medium">Dipinjam</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(borrowing.borrowed_at).toLocaleString('id-ID', {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                            <Clock className="size-4" />
                                        </div>
                                        <div className="mt-1 h-full w-0.5 bg-border" />
                                    </div>
                                    <div className="pb-4">
                                        <p className="font-medium">Batas Pengembalian</p>
                                        <p className="text-sm text-muted-foreground">
                                            {borrowing.expected_return_time
                                                ? new Date(borrowing.expected_return_time).toLocaleString('id-ID', {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })
                                                : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`flex size-8 items-center justify-center rounded-full ${borrowing.returned_at
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-muted text-muted-foreground'
                                            }`}>
                                            <Calendar className="size-4" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {borrowing.returned_at ? 'Dikembalikan' : 'Belum Dikembalikan'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {borrowing.returned_at
                                                ? new Date(borrowing.returned_at).toLocaleString('id-ID', {
                                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })
                                                : 'Status masih dipinjam'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3">
                                <span className="text-sm text-muted-foreground">Durasi:</span>
                                <span className="font-bold">{durationHours} jam</span>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${borrowing.status === 'dipinjam'
                                        ? borrowing.is_overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                    {borrowing.status === 'dipinjam'
                                        ? (borrowing.is_overdue ? 'Terlambat' : 'Dipinjam')
                                        : 'Dikembalikan'}
                                </span>
                            </div>
                        </div>

                        {/* Photos */}
                        {borrowing.borrow_photo_path && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                                    <Camera className="size-4 text-primary" />
                                    Foto Saat Pinjam
                                </h3>
                                <img
                                    src={`/storage/${borrowing.borrow_photo_path}`}
                                    alt="Foto saat peminjaman"
                                    className="w-full rounded-lg border object-cover"
                                />
                            </div>
                        )}

                        {borrowing.return_photo_path && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                                    <Camera className="size-4 text-green-600" />
                                    Foto Saat Kembali
                                </h3>
                                <img
                                    src={`/storage/${borrowing.return_photo_path}`}
                                    alt="Foto saat pengembalian"
                                    className="w-full rounded-lg border object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
