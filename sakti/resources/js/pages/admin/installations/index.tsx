import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, FileText, Filter, HardHat, Info, Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { GenerateBeritaAcaraModal } from '@/components/generate-berita-acara-modal';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Installation, PaginatedResponse } from '@/types';

interface Props {
    installations: PaginatedResponse<Installation>;
    filters: {
        status?: string;
        search?: string;
    };
    pendingCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Manajemen Pemasangan', href: '/admin/installations' },
];

export default function InstallationIndex({ installations, filters, pendingCount }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    
    // Modal State
    const [baModalOpen, setBaModalOpen] = useState(false);
    const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/installations',
            { search, status: status === 'all' ? undefined : status },
            { preserveState: true }
        );
    };

    const handleStatusChange = (val: string) => {
        setStatus(val);
        router.get(
            '/admin/installations',
            { search, status: val === 'all' ? undefined : val },
            { preserveState: true }
        );
    };

    const handleApprove = (id: number) => {
        if (confirm('Setujui pengajuan pemasangan ini? Stok barang akan langsung dikurangi.')) {
            router.post(`/admin/installations/${id}/approve`);
        }
    };

    const handleReject = (id: number) => {
        const reason = prompt('Masukkan alasan penolakan:');
        if (reason) {
            router.post(`/admin/installations/${id}/reject`, { rejection_reason: reason });
        }
    };

    const handleOpenBaModal = (installation: Installation) => {
        setSelectedInstallation(installation);
        setBaModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'menunggu_approval':
                return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'disetujui':
                return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'ditolak':
                return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Pemasangan" />
            <FlashMessage />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Manajemen Pemasangan</h2>
                        <p className="text-muted-foreground">
                            Kelola pengajuan pemasangan komponen dan asset dari teknisi.
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                            <Info className="size-4" />
                            {pendingCount} Pengajuan Menunggu
                        </div>
                    )}
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <table className="min-w-[920px] w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left">
                                    <th className="px-4 py-3 font-medium">Teknisi</th>
                                    <th className="px-4 py-3 font-medium">
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
                                                            placeholder="Cari teknisi/barang..."
                                                            className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        />
                                                    </div>
                                                    <Button type="submit" size="sm" className="h-auto py-1.5 px-3">Cari</Button>
                                                </form>
                                                {filters.search && (
                                                    <Button variant="ghost" size="sm" className="w-full mt-2 text-xs h-7" onClick={() => { setSearch(''); router.get('/admin/installations', { status: status === 'all' ? undefined : status }, { preserveState: true }); }}>
                                                        Reset Pencarian
                                                    </Button>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-4 py-3 font-medium text-center">Jumlah</th>
                                    <th className="px-4 py-3 font-medium">Lokasi & Catatan</th>
                                    <th className="px-4 py-3 font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
                                                Status
                                                <Filter className={`size-3 ${filters.status && filters.status !== 'all' ? 'text-primary opacity-100' : 'opacity-50'}`} />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48">
                                                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleStatusChange('all')} className={status === 'all' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Semua Status
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange('menunggu_approval')} className={status === 'menunggu_approval' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Menunggu Approval
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange('disetujui')} className={status === 'disetujui' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Disetujui
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange('ditolak')} className={status === 'ditolak' ? 'bg-primary/10 text-primary font-medium' : ''}>
                                                    Ditolak
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {installations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-muted-foreground">
                                            Tidak ada data pengajuan pemasangan.
                                        </td>
                                    </tr>
                                ) : (
                                    installations.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-4">
                                                <div className="font-medium">{item.user?.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(item.created_at).toLocaleString('id-ID')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-medium">{item.item?.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.item?.type === 'komponen' ? 'Komponen' : 'Asset'} — {item.item?.code_unique}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 max-w-[250px]">
                                                {item.location && (
                                                    <div className="mb-1 text-xs font-semibold">📍 {item.location}</div>
                                                )}
                                                <div className="line-clamp-2 text-xs text-muted-foreground">
                                                    {item.notes || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                                                    {item.status_label}
                                                </span>
                                                {item.status === 'ditolak' && (
                                                    <div className="mt-1 max-w-[150px] text-[10px] text-red-600">
                                                        Ket: {item.rejection_reason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {item.status === 'menunggu_approval' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                            onClick={() => handleApprove(item.id)}
                                                        >
                                                            <CheckCircle className="mr-1 size-3" /> Approve
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-8 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                                            onClick={() => handleReject(item.id)}
                                                        >
                                                            <XCircle className="mr-1 size-3" /> Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="text-[10px] text-muted-foreground">
                                                            Oleh: {item.approved_by_user?.name || 'Admin'}<br/>
                                                            {item.approved_at && new Date(item.approved_at).toLocaleDateString('id-ID')}
                                                        </div>
                                                        {item.status === 'disetujui' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/10"
                                                                onClick={() => handleOpenBaModal(item)}
                                                            >
                                                                <FileText className="mr-1 size-3" /> Generate BA
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination data={installations} />
            </div>

            {selectedInstallation && (
                <GenerateBeritaAcaraModal
                    open={baModalOpen}
                    onOpenChange={setBaModalOpen}
                    referenceId={selectedInstallation.id}
                    referenceType="Installation"
                    defaultTitle={`Pemasangan ${selectedInstallation.item?.name} di ${selectedInstallation.location || 'Lokasi'}`}
                    defaultSigner={selectedInstallation.user?.name}
                />
            )}
        </AppLayout>
    );
}
