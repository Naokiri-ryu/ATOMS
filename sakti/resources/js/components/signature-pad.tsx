import { useEffect, useRef, useState } from 'react';
import { Eraser, RotateCcw } from 'lucide-react';

interface Props {
    onSave: (signatureData: string) => void;
    placeholder?: string;
}

export function SignaturePad({ onSave, placeholder = 'Tanda tangan di sini...' }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && hasSignature) {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        setHasSignature(true);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setHasSignature(false);
        onSave('');
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed bg-white dark:bg-slate-900 shadow-inner">
                {!hasSignature && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground opacity-50">
                        <p className="text-sm italic">{placeholder}</p>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="h-[200px] w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                />
            </div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={clear}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-red-500"
                >
                    <RotateCcw className="size-3" />
                    Reset Tanda Tangan
                </button>
            </div>
        </div>
    );
}
