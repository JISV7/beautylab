import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { normalizeUrl } from '../../utils/url';

interface CourseArtworkProps {
  imageUrl: string | null;
  title: string;
}

export function CourseArtwork({ imageUrl, title }: CourseArtworkProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = normalizeUrl(imageUrl);

  if (!src || failedUrl === src) {
    return (
      <div
        className="relative flex h-full min-h-36 w-full items-center justify-center overflow-hidden bg-[var(--palette-primary)]"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 0 46%, var(--palette-accent) 46% 47%, transparent 47% 100%)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative flex flex-col items-center gap-2 text-[var(--on-primary)]">
          <BookOpen className="h-8 w-8 opacity-80" strokeWidth={1.6} />
          <span className="max-w-[10rem] text-center text-[11px] font-medium opacity-70">
            {title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(src)}
      className="h-full w-full object-cover"
    />
  );
}
