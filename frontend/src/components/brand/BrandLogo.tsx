import React from 'react';

export type BrandLogoVariant = 'full' | 'compact' | 'icon';
export type BrandLogoTheme = 'light' | 'dark';
export type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  theme?: BrandLogoTheme;
  size?: BrandLogoSize;
  className?: string;
}

const SIZE_MAP: Record<
  BrandLogoSize,
  { icon: number; wordmark: string; descriptor: string; gap: number; descriptorGap: number }
> = {
  sm: { icon: 28, wordmark: '1.0625rem', descriptor: '0.5rem', gap: 8, descriptorGap: 2 },
  md: { icon: 36, wordmark: '1.375rem', descriptor: '0.625rem', gap: 10, descriptorGap: 3 },
  lg: { icon: 48, wordmark: '1.875rem', descriptor: '0.75rem', gap: 14, descriptorGap: 5 },
};

const FONT_STACK = "Montserrat, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif";

/**
 * Cursorg isotipo: a geometric, continuous-line hexagonal C built from three
 * blue facets. The dark variant uses the light facet palette so the mark stays
 * legible on navy surfaces.
 */
const Isotipo: React.FC<{ size: number; theme: BrandLogoTheme }> = ({ size, theme }) => {
  const bottom = theme === 'dark' ? '#FBFBFE' : '#0D2B4D';
  const middle = theme === 'dark' ? '#7FD9F2' : '#1E5AA8';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path
        d="M56.25 18 32 4 7.75 18"
        stroke="#55C7E8"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.75 18v28" stroke={middle} strokeWidth="11" strokeLinecap="round" />
      <path
        d="M7.75 46 32 60l24.25-14"
        stroke={bottom}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 'md',
  className = '',
}) => {
  const dimensions = SIZE_MAP[size];
  const wordmarkColor = theme === 'dark' ? '#FBFBFE' : '#0D2B4D';
  const descriptorColor = theme === 'dark' ? '#9FC3D8' : '#6E7882';
  const showWordmark = variant !== 'icon';
  const showDescriptor = variant === 'full';

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: dimensions.gap }}
      aria-label={variant === 'icon' ? 'Cursorg' : undefined}
    >
      <Isotipo size={dimensions.icon} theme={theme} />
      {showWordmark && (
        <span
          className="inline-flex flex-col"
          style={{ gap: dimensions.descriptorGap, minWidth: 0 }}
        >
          <span
            style={{
              fontFamily: FONT_STACK,
              fontSize: dimensions.wordmark,
              fontWeight: 800,
              letterSpacing: '0.075em',
              lineHeight: 1,
              color: wordmarkColor,
              whiteSpace: 'nowrap',
            }}
          >
            CURSORG
          </span>
          {showDescriptor && (
            <span
              style={{
                fontFamily: FONT_STACK,
                fontSize: dimensions.descriptor,
                fontWeight: 600,
                letterSpacing: '0.105em',
                lineHeight: 1.25,
                textTransform: 'uppercase',
                color: descriptorColor,
                whiteSpace: 'nowrap',
              }}
            >
              Plataforma de Capacitación Corporativa
            </span>
          )}
        </span>
      )}
    </span>
  );
};
