import { useState, useEffect, useCallback } from 'react';
import type { TradeImage } from '../../types';
import styles from './ImageViewer.module.scss';

interface ImageViewerProps {
  images: TradeImage[];
}

function ImageViewer({ images }: ImageViewerProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  if (images.length === 0) {
    return <p className={styles.empty}>No images attached</p>;
  }

  return (
    <>
      <div className={styles.grid}>
        {images.map((img, index) => (
          <div
            key={img.id}
            className={styles.thumbnail}
            onClick={() => setLightboxIndex(index)}
          >
            <img src={`/api/images/${img.id}/file`} alt={img.original_name} />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img
              className={styles.lightboxImage}
              src={`/api/images/${images[lightboxIndex].id}/file`}
              alt={images[lightboxIndex].original_name}
            />
            <span className={styles.lightboxCaption}>
              {images[lightboxIndex].original_name} ({lightboxIndex + 1} / {images.length})
            </span>
          </div>

          <button className={styles.lightboxClose} onClick={closeLightbox}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default ImageViewer;
