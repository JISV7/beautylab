import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { normalizeUrl } from '../../utils/url';

interface CourseImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function CourseImage({ src, alt, className = '' }: CourseImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center bg-[#0D2B4D]/[0.06] ${className}`}
      >
        <BookOpen className="h-5 w-5 text-[#1E5AA8]/45" />
      </div>
    );
  }

  return (
    <img
      src={normalizeUrl(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
