import { Head } from '@inertiajs/react';
import { 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    FileText,
    MapPin, 
    Package, 
    Search, 
    XCircle 
} from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { GenerateBeritaAcaraModal } from '@/components/generate-berita-acara-modal';
import { Pagination } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Installation, PaginatedResponse } from '@/types';

interface Props {
    installations: PaginatedResponse<Installation>;
    filters: {
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Riwayat Pemasangan', href: '/teknisi/installations' },
];

export default function TeknisiInstallations({ installations, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [baModalOpen, setBaModalOpen] = useState(false);
    const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

    const handleFilterChange = (status: string) => {
        setStatusFilter(status);
        import('@inertiajs/react').then(({ router }) => {
            router.get('/teknisi/installations', { status: status || undefined }, { preserveState: true });
        });
    };

    const handleOpenBaModal = (installation: Installation) => {
        setSelectedInstallation(installation);
        setBaModalOpen(true);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'menunggu_approval': return <Clock className="size-4 text-amber-500" />;
            case 'disetujui': return <CheckCircle2 className="size-4 text-green-500" />;
            case 'ditolak': return <XCircle className="size-4 text-red-500" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'menunggu_approval': return 'Menunggu Approval';
            case 'disetujui': return 'Disetujui';
            case 'ditolak': return 'Ditolak';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'menunggu_approval': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'disetujui': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'ditolak': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Pemasangan" />
            <FlashMessage />

            <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="break-words text-xl font-black tracking-tight sm:text-2xl">Riwayat Pemasangan</h1>
                        <p className="text-sm text-muted-foreground">Lacak status pengajuan pemasangan komponen & asset Anda.</p>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { label: 'Semua', value: '' },
                        { label: 'Pending', value: 'menunggu_approval' },
                        { label: 'Disetujui', value: 'disetujui' },
                        { label: 'Ditolak', value: 'ditolak' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleFilterChange(tab.value)}
                            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                                statusFilter === tab.value
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {installations.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center">
                        <div className="mb-4 rounded-full bg-muted p-4">
                            <Clock className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold">Belum Ada Pengajuan</h3>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Anda belum memiliki riwayat pengajuan pemasangan barang.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                        {installations.data.map((installation) => (
                            <div key={installation.id} className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    {/* Photo placeholder/thumbnail */}
                                    <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted sm:size-24">
                                        {installation.photo_path ? (
                                            <img 
                                                src={`/storage/${installation.photo_path}`} 
                                                alt={installation.item?.name} 
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center">
                                                <Package className="size-8 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <h3 className="break-words text-base font-black leading-tight transition-colors group-hover:text-primary sm:text-lg">
                                                    {installation.item?.name}
                                                </h3>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    {installation.item?.category?.name || 'Uncategorized'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                                                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase ${getStatusColor(installation.status)}`}>
                                                    {getStatusIcon(installation.status)}
                                                    {getStatusLabel(installation.status)}
                                                </span>
                                                {installation.status === 'disetujui' && (
                                                    <button
                                                        onClick={() => handleOpenBaModal(installation)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                                                    >
                                                        <FileText className="size-3" /> Generate BA
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3 sm:gap-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="size-3.5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Jumlah</p>
                                                    <p className="font-bold">{installation.quantity} unit</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="size-3.5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Lokasi</p>
                                                    <p className="font-bold truncate max-w-[120px]">{installation.location || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3.5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Tanggal</p>
                                                    <p className="font-bold">{new Date(installation.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {installation.status === 'ditolak' && installation.rejection_reason && (
                                            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-3 text-xs text-red-700 dark:border-red-900/20 dark:bg-red-900/10">
                                                <p className="flex items-center gap-1.5 font-black uppercase mb-1">
                                                    <AlertCircle className="size-3.5" />
                                                    Alasan Penolakan:
                                                </p>
                                                <p className="italic">"{installation.rejection_reason}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
