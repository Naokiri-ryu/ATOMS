import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

// 'size' di-omit karena InputHTMLAttributes sudah memakainya sebagai
// size?: number (atribut HTML), yang bentrok dengan size bar kita ('md' | 'lg').
interface FloatingFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Text yang melayang: jadi placeholder di tengah field saat kosong, naik saat berisi / fokus. */
  label: string;
  /** md = input biasa, lg = input angka besar. Keduanya ikut membesar di layar lebar. */
  size?: 'md' | 'lg';
  /** center dipakai untuk field terpusat seperti Activation Code & Reset Code. */
  align?: 'left' | 'center';
  /** Ikon di kiri field (pointer-events-none). Memgeser teks & label ke kanan. */
  startAdornment?: ReactNode;
  /** Elemen interaktif di kanan field (mis. tombol lihat sandi) — tetap bisa diklik. */
  endAdornment?: ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
}

/**
 * Tinggi field dibesarkan HANYA di rentang laptop (768px - 1535px) lalu
 * dikembalikan ke ukuran semula di >=1536px. Breakpoint min-width biasa
 * (`lg:` = 1024px) tidak bisa dipakai: laptop 1366px dan monitor 1920px
 * sama-sama melewatinya, jadi monitor ikut membesar.
 */
const SIZE_CLASSES = {
  md: 'h-12 md:h-14 2xl:h-12',
  lg: 'h-16 md:h-20 2xl:h-16',
} as const;

/** Tertimbul: sisi kanan-bawah gelap, sisi kiri-atas lebih terang. */
const REST_SHADOW =
  'shadow-[3px_3px_10px_rgba(20,27,63,0.10),-2px_-2px_8px_rgba(20,27,63,0.05)]';

/** Tenggelam: bayangan luar dikurangi, dua bayangan inset ditambahkan. */
const FOCUS_SHADOW =
  'focus:shadow-[3px_3px_10px_rgba(20,27,63,0.08),-2px_-2px_8px_rgba(20,27,63,0.04),inset_3px_3px_10px_rgba(20,27,63,0.14),inset_-2px_-2px_8px_rgba(255,255,255,0.95)]';

/**
 * Label bergerak dengan `top` + `margin-top`, bukan `transform`:
 *   - diam  : top-1/2 + -mt-2.5  -> tepat di tengah field
 *   - ngapung: top-0  + -mt-[30px] -> 30px di atas field
 *
 * Kalau memakai translate, class resting (-translate-y-1/2) akan bentrok
 * dengan class fokus (-translate-y-[50px]) karena keduanya menulis
 * --tw-translate-y yang sama, dan pemenang ditentukan urutan CSS.
 *
 * Keadaan "sudah berisi" juga ditulis sebagai :not(:placeholder-shown):not(:focus)
 * supaya tidak menimpa state fokus ketika keduanya berlaku bareng.
 *
 * :placeholder-shown hanya match bila input punya atribut placeholder, jadi
 * komponen selalu memasang placeholder default (spasi) — kalau tidak,
 * :not(:placeholder-shown) selalu true dan label mengambang terus.
 */
const LABEL_REST = 'top-1/2 -mt-2.5';
const FLOAT_UP =
  'peer-focus:top-0 peer-focus:-mt-[30px] peer-[:not(:placeholder-shown):not(:focus)]:top-0 peer-[:not(:placeholder-shown):not(:focus)]:-mt-[30px]';
const FLOAT_SETTLED_COLOR = 'peer-[:not(:placeholder-shown):not(:focus)]:text-navy-700';
const FLOAT_FOCUS_COLOR = 'peer-focus:text-navy-600';

const FloatingField = forwardRef<HTMLInputElement, FloatingFieldProps>(
  (
    {
      label,
      size = 'md',
      align = 'left',
      startAdornment,
      endAdornment,
      wrapperClassName = '',
      inputClassName = '',
      id,
      placeholder = ' ',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const isCenter = align === 'center';

    const padding = isCenter
      ? 'px-4'
      : `${startAdornment ? 'pl-11' : 'px-4'} ${endAdornment ? 'pr-12' : ''}`;

    // Field terpusat tidak pernah menggeser label secara horizontal.
    const labelX = isCenter ? 'left-1/2 -translate-x-1/2' : startAdornment ? 'left-11' : 'left-4';
    const labelFloatX = isCenter
      ? ''
      : `peer-focus:left-3 peer-[:not(:placeholder-shown):not(:focus)]:left-3`;

    return (
      <div className={`relative w-full pt-9 ${wrapperClassName}`}>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            placeholder={placeholder}
            className={`peer w-full ${SIZE_CLASSES[size]} rounded-xl border-2 border-transparent bg-white ${padding} text-navy-900 placeholder:text-transparent transition-all duration-300 ease-out ${REST_SHADOW} focus:outline-none focus:border-navy-400 ${FOCUS_SHADOW} focus-visible:ring-2 focus-visible:ring-navy-400/60 ${isCenter ? 'text-center' : ''} ${inputClassName}`}
            {...props}
          />

          {startAdornment && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {startAdornment}
            </div>
          )}

          {endAdornment && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">{endAdornment}</div>
          )}

          <label
            htmlFor={inputId}
            className={`pointer-events-none absolute ${LABEL_REST} ${labelX} text-[15px] leading-5 font-normal text-slate-500 transition-all duration-300 ease-out ${FLOAT_UP} ${labelFloatX} ${FLOAT_FOCUS_COLOR} ${FLOAT_SETTLED_COLOR}`}
          >
            {label}
          </label>
        </div>
      </div>
    );
  }
);

FloatingField.displayName = 'FloatingField';

export default FloatingField;
