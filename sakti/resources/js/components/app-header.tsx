import { Link, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, BarChart3, Bell, Box, ClipboardCheck, ClipboardList, FileCheck, FolderOpen, LayoutGrid, Menu, Package } from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, NavItem, User } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { 
        title: 'Barang', 
        href: '/admin/items', 
        icon: Box,
        children: [
            { title: 'Semua Barang', href: '/admin/items', description: 'Lihat semua inventaris barang.' },
            { title: 'Peralatan', href: '/admin/items?type=peralatan', description: 'Daftar barang jenis peralatan.' },
            { title: 'Komponen', href: '/admin/items?type=komponen', description: 'Daftar barang jenis komponen.' },
            { title: 'Asset', href: '/admin/items?type=asset', description: 'Daftar barang jenis asset tetap.' }
        ]
    },
    { title: 'Kategori', href: '/admin/categories', icon: FolderOpen },
    { 
        title: 'Peminjaman', 
        href: '/admin/borrowings', 
        icon: ClipboardCheck,
        children: [
            { title: 'Semua Peminjaman', href: '/admin/borrowings', description: 'Lihat semua riwayat transaksi peminjaman.' },
            { title: 'Sedang Dipinjam', href: '/admin/borrowings?status=dipinjam', description: 'Daftar barang yang belum dikembalikan.' },
            { title: 'Sudah Dikembalikan', href: '/admin/borrowings?status=dikembalikan', description: 'Daftar barang yang sudah selesai dipinjam.' }
        ]
    },
    { title: 'Berita Acara', href: '/admin/berita-acara', icon: FileCheck },
    { title: 'Audit Stok', href: '/admin/audit', icon: BarChart3 },
];

const teknisiNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Peminjaman Saya', href: '/teknisi/borrowings', icon: ClipboardList },
    { title: 'Riwayat Pemasangan', href: '/teknisi/installations', icon: ClipboardCheck },
    { title: 'Berita Acara', href: '/teknisi/berita-acara', icon: FileCheck },
];

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props as unknown as { auth: { user: User } };
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    
    const activeNavItems = auth?.user?.role === 'admin' ? adminNavItems : teknisiNavItems;
    const notifications = auth?.user?.unreadNotifications || [];

    const markAsRead = (id: string | number) => {
        router.post(`/notifications/${id}/mark-read`);
    };

    const markAllAsRead = () => {
        router.post('/notifications/mark-all-read');
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-primary text-primary-foreground border-b border-primary-foreground/10 shadow-md">
                <div className="flex h-16 w-full min-w-0 items-center px-3 sm:px-6 lg:px-8">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-[34px] w-[34px] text-primary-foreground hover:bg-primary-foreground/10 hover:text-white"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Navigation menu
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-primary" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4 text-sidebar-foreground">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {activeNavItems.map((item) => (
                                                <div key={item.title} className="flex flex-col space-y-1">
                                                    <Link
                                                        href={item.href}
                                                        className={cn(
                                                            "flex items-center space-x-2 font-medium p-2 rounded-md transition-colors",
                                                            isCurrentUrl(item.href) ? "bg-primary/10 text-primary" : "hover:bg-sidebar-accent"
                                                        )}
                                                    >
                                                        {item.icon && <item.icon className="h-5 w-5" />}
                                                        <span>{item.title}</span>
                                                    </Link>
                                                    {item.children && (
                                                        <div className="ml-6 flex flex-col space-y-1 border-l pl-2">
                                                            {item.children.map(child => (
                                                                <Link
                                                                    key={child.title}
                                                                    href={child.href}
                                                                    className={cn(
                                                                        "flex items-center space-x-2 text-sm p-2 rounded-md transition-colors",
                                                                        isCurrentUrl(child.href) ? "bg-primary/10 text-primary font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                                                    )}
                                                                >
                                                                    <span>{child.title}</span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href="/dashboard"
                        prefetch
                        className="flex min-w-0 items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden h-full items-center lg:flex flex-1 justify-start ml-6 w-full">
                        <NavigationMenu className="flex h-full items-stretch justify-start w-full max-w-full">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2 justify-start">
                                {activeNavItems.map((item, index) => {
                                    const isActive = isCurrentUrl(item.href);
                                    return (
                                        <NavigationMenuItem
                                            key={index}
                                            className="relative flex h-full items-center"
                                            onMouseEnter={() => setHoveredIndex(index)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                        >
                                            {item.children ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className={cn(
                                                                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:bg-primary-foreground/10 disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-primary-foreground/10 hover:text-white data-[state=open]:bg-primary-foreground/10 data-active:bg-primary-foreground/10 h-10 py-2 px-4 shadow-none text-primary-foreground',
                                                                isActive && 'bg-primary-foreground/20 font-semibold'
                                                            )}
                                                        >
                                                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                            {item.title}
                                                            <ChevronDown className="ml-1 h-3 w-3 opacity-70" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-56 p-2">
                                                        {item.children.map((child, idx) => (
                                                            <DropdownMenuItem key={idx} asChild className="cursor-pointer">
                                                                <Link href={child.href} className="flex flex-col items-start py-2">
                                                                    <span className="font-medium">{child.title}</span>
                                                                    {child.description && (
                                                                        <span className="text-xs text-muted-foreground mt-1 line-clamp-1">{child.description}</span>
                                                                    )}
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:bg-primary-foreground/10 disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-primary-foreground/10 hover:text-white data-[state=open]:bg-primary-foreground/10 data-active:bg-primary-foreground/10 h-10 py-2 px-4 shadow-none text-primary-foreground',
                                                        isActive && 'bg-primary-foreground/20 font-semibold'
                                                    )}
                                                >
                                                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                    {item.title}
                                                </Link>
                                            )}
                                            
                                            {/* Sliding Indicator */}
                                            {(hoveredIndex === index || (isActive && hoveredIndex === null)) && (
                                                <motion.div
                                                    layoutId="header-indicator"
                                                    className="absolute bottom-0 left-0 h-[4px] w-full bg-white rounded-t-sm shadow-[0_-2px_10px_rgba(255,255,255,0.5)]"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                        </NavigationMenuItem>
                                    );
                                })}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex shrink-0 items-center space-x-2 sm:space-x-3">
                        {/* Header Actions Portal Target */}
                        <div id="header-actions-portal" className="hidden items-center gap-2 sm:flex"></div>

                        {/* Notifications Bell */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative size-10 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground"
                                >
                                    <Bell className="h-5 w-5" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-primary" />
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[calc(100vw-1rem)] max-w-80" align="end">
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        Notifikasi
                                        {notifications.length > 0 && (
                                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                                {notifications.length}
                                            </span>
                                        )}
                                    </span>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-muted-foreground hover:text-primary underline"
                                        >
                                            Tandai semua dibaca
                                        </button>
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            Tidak ada notifikasi baru.
                                        </div>
                                    ) : (
                                        notifications.map((notif: any) => {
                                            const isLowStock = notif.data?.type === 'low_stock';
                                            const isOverdue  = notif.data?.type === 'overdue_warning';
                                            return (
                                                <DropdownMenuItem
                                                    key={notif.id}
                                                    className="flex flex-col items-start p-3 cursor-pointer whitespace-normal border-b last:border-b-0 focus:bg-accent"
                                                >
                                                    <div className="mb-1 flex w-full flex-col gap-1 sm:flex-row sm:justify-between">
                                                        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${
                                                            isLowStock
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : isOverdue
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {isLowStock && <Package className="size-3" />}
                                                            {isOverdue  && <AlertTriangle className="size-3" />}
                                                            {isLowStock ? 'Stok Menipis' : isOverdue ? 'Keterlambatan' : 'Sistem'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground my-1.5 leading-snug">
                                                        {notif.data?.message}
                                                    </p>
                                                    {isLowStock && notif.data?.item_id && (
                                                        <Link
                                                            href={`/admin/items/${notif.data.item_id}`}
                                                            className="mb-1.5 text-xs font-medium text-amber-700 hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Lihat Barang →
                                                        </Link>
                                                    )}
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="w-full text-xs h-7"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notif.id);
                                                        }}
                                                    >
                                                        Tandai Sudah Dibaca
                                                    </Button>
                                                </DropdownMenuItem>
                                            );
                                        })
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Avatar */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1 border border-primary-foreground/20 hover:bg-primary-foreground/10"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth?.user?.avatar}
                                            alt={auth?.user?.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-white text-primary font-bold">
                                            {getInitials(auth?.user?.name || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth?.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70 bg-background">
                    <div className="flex h-12 w-full items-center justify-start px-4 sm:px-6 lg:px-8 text-neutral-500">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}


        </>
    );
}
