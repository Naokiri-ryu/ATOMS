export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 shrink-0 items-center justify-center p-0 sm:size-12">
                <img src="/logo-airnav.png" alt="AirNav Indonesia" className="h-full w-full object-contain drop-shadow-sm" />
            </div>
            <div className="ml-2 grid min-w-0 flex-1 text-left text-sm">
                <span className="truncate text-lg leading-tight font-bold text-white drop-shadow-sm sm:text-xl">SAKTI</span>
                <span className="hidden truncate text-[11px] font-medium text-white/90 drop-shadow-sm sm:block">Inventaris & Teknisi</span>
            </div>
        </>
    );
}
