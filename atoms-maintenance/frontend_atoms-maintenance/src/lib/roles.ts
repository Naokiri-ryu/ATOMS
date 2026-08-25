import type { User } from '@/types';

const ADMIN = 'Admin';
const MANAGER = 'Manager Teknik';

export function canEditCnsd(user?: User | null): boolean {
  if (!user) return false;
  return (
    user.role === ADMIN ||
    user.role === MANAGER ||
    user.role === 'Supervisor CNSD' ||
    user.role === 'Teknisi CNSD'
  );
}

export function canEditTfp(user?: User | null): boolean {
  if (!user) return false;
  return (
    user.role === ADMIN ||
    user.role === MANAGER ||
    user.role === 'Supervisor TFP' ||
    user.role === 'Teknisi TFP'
  );
}
