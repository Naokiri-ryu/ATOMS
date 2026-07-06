import jsQR from 'jsqr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Keyboard, Lock, QrCode, RefreshCw, ShieldAlert, Video } from 'lucide-react';

interface QrScannerProps {
    onScan: (code: string) => void;
    onError?: (error: string) => void;
    active?: boolean;
}

type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported' | 'error';

export function QrScanner({ onScan, onError, active = true }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number>(0);
    const lastScanTimeRef = useRef<number>(0);
    const isScanningRef = useRef<boolean>(false);
    
    const [cameraState, setCameraState] = useState<CameraState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [showManual, setShowManual] = useState(false);

    const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const tick = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || cameraState !== 'ready') return;

        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            
            if (context) {
                canvas.height = videoRef.current.videoHeight;
                canvas.width = videoRef.current.videoWidth;
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code && code.data) {
                    const now = Date.now();
                    // Cooldown 2 seconds for the same code
                    if (now - lastScanTimeRef.current > 2000) {
                        lastScanTimeRef.current = now;
                        onScan(code.data);
                    }
                }
            }
        }
        
        if (active) {
            animationRef.current = requestAnimationFrame(tick);
        }
    }, [active, cameraState, onScan]);

    const startCamera = useCallback(async () => {
        if (!isSecure) {
            setCameraState('unsupported');
            setErrorMsg('Website harus diakses via HTTPS untuk menggunakan kamera.');
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraState('unsupported');
            setErrorMsg('Browser Anda tidak mendukung akses kamera.');
            return;
        }

        setCameraState('requesting');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraState('ready');
            }
        } catch (err: any) {
            console.error('Camera error:', err);

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraState('denied');
                setErrorMsg('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
            } else if (err.name === 'NotFoundError') {
                setCameraState('error');
                setErrorMsg('Kamera tidak ditemukan pada perangkat Anda.');
            } else if (err.name === 'OverconstrainedError') {
                // Retry without constraints
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        await videoRef.current.play();
                        setCameraState('ready');
                    }
                } catch {
                    setCameraState('error');
                    setErrorMsg('Tidak dapat mengakses kamera.');
                }
            } else {
                setCameraState('error');
                setErrorMsg(`Gagal mengakses kamera: ${err.message || 'Error tidak diketahui'}`);
            }

            onError?.(errorMsg);
        }
    }, [isSecure, onError, errorMsg]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }, []);

    useEffect(() => {
        if (active) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [active, startCamera, stopCamera]);

    useEffect(() => {
        if (cameraState === 'ready' && active) {
            animationRef.current = requestAnimationFrame(tick);
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [cameraState, active, tick]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = manualCode.trim();
        if (code) {
            onScan(code);
            setManualCode('');
        }
    };

    // Manual input section (always available)
    const ManualInputSection = () => (
        <div className="space-y-3">
            {!showManual ? (
                <button
                    onClick={() => setShowManual(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                    <Keyboard className="size-4" />
                    Input Kode Manual
                </button>
            ) : (
                <form onSubmit={handleManualSubmit} className="rounded-xl border bg-card p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-medium">Masukkan Kode Barang</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="SAKTI-XXXXXXXX"
                            className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!manualCode.trim()}
                            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                            Cari
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Kode tercetak di bawah QR Code pada stiker barang
                    </p>
                </form>
            )}
        </div>
    );

    // Unsupported / HTTPS required
    if (cameraState === 'unsupported') {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950">
                    <Lock className="mx-auto size-10 text-amber-500" />
                    <h4 className="mt-3 font-semibold text-amber-700 dark:text-amber-400">HTTPS Diperlukan untuk Kamera</h4>
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{errorMsg}</p>
                    <div className="mt-4 rounded-lg bg-amber-100 p-3 text-left dark:bg-amber-900/50">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Aktifkan HTTPS (Laravel Herd):</p>
                        <code className="mt-1 block rounded bg-amber-200/50 px-2 py-1 text-xs dark:bg-amber-800/50">herd secure mgnk</code>
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            Kemudian akses via <strong>https://mgnk.test</strong>
                        </p>
                    </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">Atau gunakan input manual di bawah:</p>
                <ManualInputSection />
            </div>
        );
    }

    // Permission denied
    if (cameraState === 'denied') {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
                    <ShieldAlert className="mx-auto size-10 text-red-500" />
                    <h4 className="mt-3 font-semibold text-red-700 dark:text-red-400">Izin Kamera Ditolak</h4>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                    <div className="mt-4 rounded-lg bg-red-100 p-3 text-left dark:bg-red-900/50">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300">Cara Mengizinkan:</p>
                        <ol className="mt-1 space-y-1 text-xs text-red-600 dark:text-red-400">
                            <li>1. Klik ikon 🔒 di address bar</li>
                            <li>2. Cari "Kamera" → ubah ke "Izinkan"</li>
                            <li>3. Refresh halaman</li>
                        </ol>
                    </div>
                    <button
                        onClick={() => { setCameraState('idle'); startCamera(); }}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        <RefreshCw className="size-4" />
                        Coba Lagi
                    </button>
                </div>
                <ManualInputSection />
            </div>
        );
    }

    // Generic error
    if (cameraState === 'error') {
        return (
            <div className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
                    <AlertTriangle className="mx-auto size-10 text-red-500" />
                    <h4 className="mt-3 font-semibold text-red-700 dark:text-red-400">Error Kamera</h4>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                    <button
                        onClick={() => { setCameraState('idle'); startCamera(); }}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        <RefreshCw className="size-4" />
                        Coba Lagi
                    </button>
                </div>
                <ManualInputSection />
            </div>
        );
    }

    // Requesting permission / idle
    if (cameraState === 'requesting' || cameraState === 'idle') {
        return (
            <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-black">
                    <video ref={videoRef} className="w-full" playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <Video className="mx-auto size-8 animate-pulse text-primary" />
                            <p className="mt-2 text-sm text-white/80">Meminta izin akses kamera...</p>
                            <p className="mt-1 text-xs text-white/50">Klik "Izinkan" / "Allow" pada popup browser</p>
                        </div>
                    </div>
                </div>
                <ManualInputSection />
            </div>
        );
    }

    // Ready - camera active
    return (
        <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-black">
                <video ref={videoRef} className="w-full" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-48 rounded-2xl border-4 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
                </div>
            </div>

            <div className="text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                    <QrCode className="mr-1 inline size-4" />
                    Arahkan kamera ke QR Code barang
                </p>
            </div>

            <ManualInputSection />
        </div>
    );
}
