import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    videoSrc,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    videoSrc?: string;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} videoSrc={videoSrc} {...props}>
            {children}
        </AuthLayoutTemplate>
    );
}
