import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, Lock, RefreshCw, ShieldAlert, Video } from 'lucide-react';

interface WebcamCaptureProps {
    onCapture: (imageBase64: string) => void;
    facingMode?: 'user' | 'environment';
}

type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported' | 'error';

export function WebcamCapture({ onCapture, facingMode = 'user' }: WebcamCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [timestamp, setTimestamp] = useState(new Date().toLocaleString('id-ID'));
    const [cameraState, setCameraState] = useState<CameraState>('idle');
    const [captured, setCaptured] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Check if secure context
    const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    useEffect(() => {
        const timer = setInterval(() => {
            setTimestamp(new Date().toLocaleString('id-ID'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const startCamera = useCallback(async () => {
        // Check secure context first
        if (!isSecure) {
            setCameraState('unsupported');
            setErrorMsg('Website harus diakses via HTTPS untuk menggunakan kamera. Jalankan "herd secure" di terminal untuk mengaktifkan HTTPS.');
            return;
        }

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraState('unsupported');
            setErrorMsg('Browser Anda tidak mendukung akses kamera. Gunakan Chrome, Firefox, atau Edge versi terbaru.');
            return;
        }

        setCameraState('requesting');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
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
                setErrorMsg('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraState('error');
                setErrorMsg('Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera yang terhubung.');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setCameraState('error');
                setErrorMsg('Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi.');
            } else if (err.name === 'OverconstrainedError') {
                setCameraState('error');
                setErrorMsg('Kamera tidak mendukung konfigurasi yang diminta. Mencoba ulang...');
                // Retry without facing mode constraint
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        await videoRef.current.play();
                        setCameraState('ready');
                    }
                } catch {
                    setErrorMsg('Tidak dapat mengakses kamera.');
                }
            } else {
                setCameraState('error');
                setErrorMsg(`Gagal mengakses kamera: ${err.message || 'Error tidak diketahui'}`);
            }
        }
    }, [facingMode, isSecure]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0);

        const currentTime = new Date().toLocaleString('id-ID');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText(`📅 ${currentTime}`, 10, canvas.height - 14);

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setCaptured(base64);
        onCapture(base64);

        stopCamera();
    };

    const retake = () => {
        setCaptured(null);
        setCameraState('idle');
        startCamera();
    };

    // Captured state
    if (captured) {
        return (
            <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border">
                    <img src={captured} alt="Captured photo" className="w-full" />
                </div>
                <button
                    onClick={retake}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                    <RefreshCw className="size-4" />
                    Ambil Ulang
                </button>
            </div>
        );
    }

    // Unsupported / HTTPS required
    if (cameraState === 'unsupported') {
        return (
            <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950">
                <Lock className="mx-auto size-10 text-amber-500" />
                <h4 className="mt-3 font-semibold text-amber-700 dark:text-amber-400">HTTPS Diperlukan</h4>
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{errorMsg}</p>
                <div className="mt-4 rounded-lg bg-amber-100 p-3 text-left dark:bg-amber-900/50">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Cara Mengaktifkan HTTPS (Laravel Herd):</p>
                    <code className="mt-1 block text-xs text-amber-600 dark:text-amber-400">herd secure mgnk</code>
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Lalu akses via <strong>https://mgnk.test</strong>
                    </p>
                </div>
            </div>
        );
    }

    // Permission denied
    if (cameraState === 'denied') {
        return (
            <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
                <ShieldAlert className="mx-auto size-10 text-red-500" />
                <h4 className="mt-3 font-semibold text-red-700 dark:text-red-400">Izin Kamera Ditolak</h4>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                <div className="mt-4 rounded-lg bg-red-100 p-3 text-left dark:bg-red-900/50">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">Cara Mengizinkan:</p>
                    <ol className="mt-1 space-y-1 text-xs text-red-600 dark:text-red-400">
                        <li>1. Klik ikon 🔒 di address bar browser</li>
                        <li>2. Cari pengaturan "Kamera" atau "Camera"</li>
                        <li>3. Ubah ke "Izinkan" atau "Allow"</li>
                        <li>4. Refresh halaman ini</li>
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
        );
    }

    // Generic error
    if (cameraState === 'error') {
        return (
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
        );
    }

    // Requesting permission
    if (cameraState === 'requesting' || cameraState === 'idle') {
        return (
            <div className="space-y-3">
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
            </div>
        );
    }

    // Ready - camera active
    return (
        <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-black">
                <video ref={videoRef} className="w-full" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                {/* Live timestamp overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                    <p className="text-sm font-medium text-white">📅 {timestamp}</p>
                </div>
            </div>

            <button
                onClick={capturePhoto}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
                <Camera className="size-5" />
                Ambil Foto
            </button>
        </div>
    );
}
