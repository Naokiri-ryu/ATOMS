import React from 'react';
import { cn } from '@/lib/utils';

interface RatingTagItem {
  rating: string;
  valid_until?: string | null;
  keterangan?: string | null;
}

interface RatingTagsProps {
  ratings?: RatingTagItem[];
  size?: 'xs' | 'sm';
  max?: number;
  className?: string;
}

const CNS_RATING_NAMES = ['NAVIGASI', 'COMMUNICATION', 'SURVEILLANCE', 'DATA PROCESSING'];

function isCnsRating(rating: string): boolean {
  return CNS_RATING_NAMES.includes(rating.trim().toUpperCase());
}

function isExpired(validUntil?: string | null): boolean {
  if (!validUntil) return false;
  const trimmed = validUntil.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const expiry = new Date(trimmed + 'T00:00:00');
    if (!Number.isNaN(expiry.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiry.getTime() < today.getTime();
    }
  }
  return false;
}

function formatValidUntil(validUntil?: string | null): string {
  const trimmed = validUntil?.trim();
  if (!trimmed) return 'Berlaku selamanya';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}-${m}-${y}`;
  }
  return trimmed;
}

export const RatingTags: React.FC<RatingTagsProps> = ({ ratings = [], size = 'sm', max, className }) => {
  if (!ratings.length) return null;

  const visible = typeof max === 'number' && max > 0 ? ratings.slice(0, max) : ratings;
  const hiddenCount = ratings.length - visible.length;

  const sizeClasses =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[9px]'
      : 'px-2 py-0.5 text-[10px]';

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map((r, i) => {
        const expired = isExpired(r.valid_until);
        const title = expired
          ? `${r.rating} — kedaluwarsa ${formatValidUntil(r.valid_until)}`
          : `${r.rating} — ${formatValidUntil(r.valid_until)}`;
        return (
          <span
            key={`${r.rating}-${i}`}
            title={title}
            className={cn(
              'inline-flex items-center rounded-full font-semibold border',
              sizeClasses,
              expired
                ? 'bg-gray-100 border-gray-200 text-gray-500'
                : isCnsRating(r.rating)
                  ? 'bg-accent-50 border-accent-200 text-accent-700'
                  : 'bg-brand-50 border-brand-200 text-brand-700'
            )}
          >
            {r.rating}
          </span>
        );
      })}
      {hiddenCount > 0 && (
        <span
          title={`${hiddenCount} rating lainnya`}
          className={cn(
            'inline-flex items-center rounded-full font-semibold border border-brand-200 bg-brand-50 text-brand-700',
            sizeClasses
          )}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

export default RatingTags;