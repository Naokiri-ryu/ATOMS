import { useForm } from '@inertiajs/react';
import { Check, ChevronDown, FileText, Loader2, Send, UserPlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    referenceId?: number;
    referenceType?: 'Installation' | 'Borrowing';
    defaultTitle?: string;
    defaultType?: 'pemasangan' | 'pelepasan' | 'serah_terima';
    defaultSigner?: string;
    defaultLocation?: string;
}

interface TeknisiEntry {
    name: string;
    title: string;
}

const MANAGERS = [
    { name: 'Dudik Fahrudin Sukarno', title: 'Manager Teknik 1' },
    { name: 'Andi Wibowo',            title: 'Manager Teknik 2' },
    { name: 'Efried Nara Perkasa',    title: 'Manager Teknik 3' },
    { name: 'Alam Fahmi',             title: 'Manager Teknik 4' },
    { name: 'Netty Septa Cristila',   title: 'Manager Teknik 5' },
];

const TEKNISI_CNS: TeknisiEntry[] = [
    { name: 'Moch. Ichsan',           title: 'SPV CNS' },
    { name: 'Nur Hukim',              title: 'SPV CNS' },
    { name: 'Aditya Huzairi P',       title: 'SPV CNS' },
    { name: 'Khoirul M.A',            title: 'CNS' },
    { name: 'Argo Pragolo',           title: 'CNS' },
    { name: 'Saiful Bahris',          title: 'CNS' },
    { name: 'Silvy Retno Andriani',   title: 'CNS' },
    { name: 'Tria Sabda Utama',       title: 'CNS' },
    { name: 'Febri Dwi C',            title: 'CNS' },
    { name: 'M. Yusuf Triono',        title: 'CNS' },
    { name: 'Dani Ridzal',            title: 'CNS' },
    { name: 'Nur Shella Firdaus',     title: 'CNS' },
    { name: 'Amirzan Ridho W',        title: 'CNS' },
    { name: 'Erazuardi Zulfahmi',     title: 'CNS' },
    { name: 'Moh. Syamsudin',         title: 'CNS' },
    { name: 'Yourdan C.P',            title: 'CNS' },
    { name: 'Rhomadoni S.K.D',        title: 'CNS' },
    { name: 'Safira Saraswati',       title: 'CNS' },
    { name: 'Aldhi Deska P',          title: 'CNS' },
    { name: 'Riyan Fauzi',            title: 'CNS' },
    { name: 'Elvita Agustina',        title: 'CNS' },
    { name: 'Rendy Panca A P',        title: 'CNS' },
    { name: 'I Kadek Dwija S',        title: 'CNS' },
    { name: 'Pandu Indrajaya',        title: 'CNS' },
    { name: 'Teguh M',                title: 'CNS' },
    { name: 'Yusri H.',               title: 'CNS' },
    { name: 'Adam Bukhori',           title: 'CNS' },
    { name: 'Dwiki Setyo W',          title: 'CNS' },
    { name: 'Septi Rahman Sari',      title: 'CNS' },
    { name: 'Windi Tri Setyawati',    title: 'CNS' },
];

const TEKNISI_TFP: TeknisiEntry[] = [
    { name: 'Fajar Kusuma W',         title: 'SPV TFP' },
    { name: 'Priyoko',                title: 'SPV TFP' },
    { name: 'Iqbal Mustika',          title: 'TFP' },
    { name: 'Agustina Anggreini',     title: 'TFP' },
    { name: 'Fajar Nugroho',          title: 'TFP' },
    { name: 'Bian Prasetia H',        title: 'TFP' },
    { name: 'Sofi Dwi Hidayati',      title: 'TFP' },
    { name: 'M. Feizar Noor',         title: 'TFP' },
    { name: 'Dwi Prasetyo Adi',       title: 'TFP' },
    { name: 'Yoga Arifal P',          title: 'TFP' },
    { name: 'Ilmin Syarif H',         title: 'TFP' },
    { name: 'Dwi Puji Rahayu',        title: 'TFP' },
    { name: 'Andhika Bhaskara J',     title: 'TFP' },
    { name: 'M. Aidin Effendi',       title: 'TFP' },
    { name: 'A. M. Yasin',            title: 'TFP' },
    { name: 'Frisza Vradana',         title: 'TFP' },
    { name: 'Karang Samudra',         title: 'TFP' },
];

const ALL_TEKNISI = [...TEKNISI_CNS, ...TEKNISI_TFP];

// ===== Combobox searchable (single pick, exclude already selected) =====
function TeknisiCombobox({
    excluded,
    onSelect,
    placeholder = 'Pilih atau ketik nama...',
}: {
    excluded: string[];
    onSelect: (t: TeknisiEntry) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = ALL_TEKNISI.filter(
        (t) =>
            !excluded.includes(t.name) &&
            (t.name.toLowerCase().includes(search.toLowerCase()) ||
                t.title.toLowerCase().includes(search.toLowerCase())),
    );

    const handleSelect = (t: TeknisiEntry) => {
        onSelect(t);
        setSearch('');
        setOpen(false);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen((o) => !o);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={cn(
                    'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
                    'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-muted-foreground',
                )}
            >
                <span className="truncate">{placeholder}</span>
                <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                        <Input
                            ref={inputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Ketik nama teknisi..."
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setOpen(false);
                                if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0]);
                            }}
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-muted-foreground">Tidak ditemukan.</li>
                        ) : (
                            filtered.map((t) => (
                                <li
                                    key={t.name}
                                    onClick={() => handleSelect(t)}
                                    className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                                >
                                    <span>
                                        {t.name}
                                        <span className="ml-1.5 text-xs text-muted-foreground">({t.title})</span>
                                    </span>
                                    <Check className="size-3.5 text-primary opacity-0" />
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

export function GenerateBeritaAcaraModal({
    open,
    onOpenChange,
    referenceId,
    referenceType,
    defaultTitle = '',
    defaultType = 'pemasangan',
    defaultSigner = '',
    defaultLocation = '',
}: Props) {
    // Multi-teknisi state (terpisah dari useForm karena array of objects)
    const [teknisiList, setTeknisiList] = useState<TeknisiEntry[]>(
        defaultSigner ? [{ name: defaultSigner, title: '' }] : [],
    );

    const { data, setData, post, processing, reset, errors, transform } = useForm({
        title: defaultTitle || `Berita Acara ${referenceType === 'Installation' ? 'Pemasangan' : 'Peminjaman'}`,
        type: defaultType,
        description: '',
        nomor_suffix: '',      // bagian setelah BAC.XXX; kosong = auto GTT-...
        item_keterangan: '',   // keterangan di kolom tabel barang
        signers: [] as { name: string; title: string }[],
        manager_name: '',
        manager_title: '',
        location: defaultLocation,
        item_merk: '',
        reference_id: referenceId,
        reference_type: referenceType,
    });

    const addTeknisi = (t: TeknisiEntry) => {
        const updated = [...teknisiList, t];
        setTeknisiList(updated);
        setData('signers', updated);
    };

    const removeTeknisi = (name: string) => {
        const updated = teknisiList.filter((t) => t.name !== name);
        setTeknisiList(updated);
        setData('signers', updated);
    };

    const handleManagerChange = (name: string) => {
        const manager = MANAGERS.find((m) => m.name === name);
        setData((prev) => ({
            ...prev,
            manager_name: name,
            manager_title: manager?.title ?? '',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const prefix = window.location.pathname.startsWith('/admin') ? '/admin' : '/teknisi';
        // Sync signers dan rapikan suffix sebelum submit.
        transform((currentData) => ({
            ...currentData,
            nomor_suffix: currentData.nomor_suffix.trim(),
            signers: teknisiList,
        }));
        post(`${prefix}/berita-acara/generate`, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
                setTeknisiList([]);
            },
        });
    };

    const selectedManager = MANAGERS.find((m) => m.name === data.manager_name);
    const excludedNames = teknisiList.map((t) => t.name);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        Generate Berita Acara Digital
                    </DialogTitle>
                    <DialogDescription>
                        Nomor BA akan di-generate otomatis. Lengkapi data di bawah ini.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Judul */}
                    <div className="grid gap-2">
                        <Label htmlFor="title">Judul Dokumen</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Contoh: Pemasangan Modul SMA DVOR VRB-52"
                            required
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Nomor BA */}
                    <div className="grid gap-2">
                        <Label htmlFor="nomor_suffix">
                            Nomor BA
                            <span className="ml-1 text-[10px] text-muted-foreground">(opsional — kosongkan untuk auto)</span>
                        </Label>
                        <div className="flex items-center gap-2">
                            <span className="rounded-md border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground whitespace-nowrap">BAC.###</span>
                            <span className="text-muted-foreground">/</span>
                            <Input
                                id="nomor_suffix"
                                value={data.nomor_suffix}
                                onChange={(e) => setData('nomor_suffix', e.target.value)}
                                placeholder="GTT-03/06/LPPNPI/TEK/V/2026"
                                className="font-mono text-sm"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Kosongkan untuk otomatis. Contoh: GTT-03/06/LPPNPI/TEK/V/2026
                        </p>
                    </div>

                    {/* Jenis BA + Merk/Type + Lokasi */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-2">
                            <Label>Jenis BA</Label>
                            <Select
                                value={data.type}
                                onValueChange={(val: 'pemasangan' | 'pelepasan' | 'serah_terima') =>
                                    setData('type', val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pemasangan">Pemasangan</SelectItem>
                                    <SelectItem value="pelepasan">Pelepasan</SelectItem>
                                    <SelectItem value="serah_terima">Serah Terima</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="item_merk">
                                Merk/Type
                                <span className="ml-1 text-[10px] text-muted-foreground">(opsional)</span>
                            </Label>
                            <Input
                                id="item_merk"
                                value={data.item_merk}
                                onChange={(e) => setData('item_merk', e.target.value)}
                                placeholder="Contoh: Cisco, Huawei"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Lokasi</Label>
                            <Input
                                id="location"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                placeholder="Contoh: Ruang MER"
                            />
                        </div>
                    </div>

                    {/* Teknisi Pelaksana (multi) */}
                    <div className="grid gap-2">
                        <Label>
                            Teknisi Pelaksana
                            <span className="ml-1.5 text-[10px] text-muted-foreground">
                                (bisa lebih dari satu)
                            </span>
                        </Label>

                        {/* Daftar teknisi yang sudah dipilih */}
                        {teknisiList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2">
                                {teknisiList.map((t) => (
                                    <span
                                        key={t.name}
                                        className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                                    >
                                        {t.name}
                                        <span className="text-primary/60">({t.title})</span>
                                        <button
                                            type="button"
                                            onClick={() => removeTeknisi(t.name)}
                                            className="ml-0.5 rounded-full hover:text-red-500"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Combobox tambah teknisi */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <TeknisiCombobox
                                    excluded={excludedNames}
                                    onSelect={addTeknisi}
                                    placeholder={
                                        teknisiList.length === 0
                                            ? 'Pilih atau ketik nama...'
                                            : '+ Tambah teknisi lain...'
                                    }
                                />
                            </div>
                            {teknisiList.length === 0 && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                    <UserPlus className="size-3.5" /> Pilih minimal 1
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Manager Pengetahui */}
                    <div className="grid gap-2">
                        <Label>Manager Pengetahui</Label>
                        <Select value={data.manager_name} onValueChange={handleManagerChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih manager..." />
                            </SelectTrigger>
                            <SelectContent>
                                {MANAGERS.map((m) => (
                                    <SelectItem key={m.name} value={m.name}>
                                        <span className="font-medium">{m.name}</span>
                                        <span className="ml-1 text-xs text-muted-foreground">({m.title})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedManager && (
                            <p className="text-[11px] text-muted-foreground -mt-1">
                                {selectedManager.title}
                                <span className="ml-2 text-amber-600 font-medium">· TTD menyusul</span>
                            </p>
                        )}
                    </div>

                    {/* Keterangan Pekerjaan + Keterangan Tabel */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                Keterangan Pekerjaan
                                <span className="ml-1 text-[10px] text-muted-foreground">(opsional)</span>
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Contoh: pemasangan pada peralatan Recorder ATC System"
                                rows={2}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="item_keterangan">
                                Keterangan Barang
                                <span className="ml-1 text-[10px] text-muted-foreground">(kolom tabel)</span>
                            </Label>
                            <Textarea
                                id="item_keterangan"
                                value={data.item_keterangan}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setData('item_keterangan', e.target.value)
                                }
                                placeholder="Contoh: Normal Operasi, Kondisi Baik"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || teknisiList.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 size-4" />
                                    Generate & Simpan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
