import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    videoSrc,
}: AuthLayoutProps) {
    return (
        <div className={`relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 ${videoSrc ? 'overflow-hidden text-white bg-slate-950' : 'bg-background'}`}>
            {/* Video Background Layer */}
            {videoSrc && (
                <>
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="fixed inset-0 h-full w-full object-cover z-0"
                    >
                        <source src={videoSrc} type="video/mp4" />
                    </video>
                    {/* Dark overlay for readability */}
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-0" />
                </>
            )}

            <div className="relative z-10 w-full max-w-sm">
                <div className={`flex flex-col gap-8 ${videoSrc ? 'rounded-2xl bg-black/20 p-8 backdrop-blur-xl border border-white/10 shadow-2xl' : ''}`}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-2 flex h-20 w-auto items-center justify-center">
                                <img src="/logo-airnav.png" alt="AirNav Indonesia" className="h-full w-auto object-contain drop-shadow-md" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </div>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className={`text-center text-sm ${videoSrc ? 'text-white/80' : 'text-muted-foreground'}`}>
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
