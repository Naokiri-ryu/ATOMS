import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Box,
    ClipboardCheck,
    ClipboardList,
    FileCheck,
    FolderOpen,
    HardHat,
    LayoutGrid,
    QrCode,
    TrendingUp,
    Wrench,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, User } from '@/types';

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Barang',
        href: '/admin/items',
        icon: Box,
    },
    {
        title: 'Kategori',
        href: '/admin/categories',
        icon: FolderOpen,
    },
    {
        title: 'Peminjaman',
        href: '/admin/borrowings',
        icon: ClipboardCheck,
    },
    {
        title: 'Pemasangan',
        href: '/admin/installations',
        icon: HardHat,
    },
    {
        title: 'Analitik Stok',
        href: '/admin/stock/traffic',
        icon: TrendingUp,
    },
    {
        title: 'Berita Acara',
        href: '/admin/berita-acara',
        icon: FileCheck,
    },
    {
        title: 'Audit Stok',
        href: '/admin/audit',
        icon: BarChart3,
    },
];

const teknisiNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Peminjaman Saya',
        href: '/teknisi/borrowings',
        icon: ClipboardList,
    },
    {
        title: 'Riwayat Pemasangan',
        href: '/teknisi/installations',
        icon: ClipboardCheck,
    },
    {
        title: 'Berita Acara',
        href: '/teknisi/berita-acara',
        icon: FileCheck,
    },
];


const footerNavItems: NavItem[] = [
    {
        title: 'Bantuan',
        href: '#',
        icon: Wrench,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const navItems = auth.user.role === 'admin' ? adminNavItems : teknisiNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
