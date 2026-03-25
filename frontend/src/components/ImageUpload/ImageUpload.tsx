import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { TradeImage } from '../../types';
import styles from './ImageUpload.module.scss';

interface ImageUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingImages?: TradeImage[];
  onDeleteExisting?: (id: string) => void;
}

function ImageUpload({ files, onFilesChange, existingImages, onDeleteExisting }: ImageUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onFilesChange([...files, ...accepted]);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pastedFiles: File[] = [];
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        e.preventDefault();
        onFilesChange([...files, ...pastedFiles]);
      }
    },
    [files, onFilesChange]
  );

  return (
    <div className={styles.wrapper} onPaste={handlePaste}>
      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
      >
        <input {...getInputProps()} />
        <div className={styles.dropzoneIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <div className={styles.dropzoneText}>
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div className={styles.dropzoneHint}>PNG, JPG, GIF up to 10MB. You can also paste from clipboard.</div>
      </div>

      {existingImages && existingImages.length > 0 && (
        <>
          <span className={styles.existingLabel}>Existing Images</span>
          <div className={styles.previews}>
            {existingImages.map((img) => (
              <div key={img.id} className={styles.previewItem}>
                <img
                  className={styles.previewImage}
                  src={`/api/images/${img.id}/file`}
                  alt={img.original_name}
                />
                {onDeleteExisting && (
                  <button
                    type="button"
                    className={styles.previewRemove}
                    onClick={() => onDeleteExisting(img.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {files.length > 0 && (
        <>
          <span className={styles.existingLabel}>New Images ({files.length})</span>
          <div className={styles.previews}>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className={styles.previewItem}>
                <img
                  className={styles.previewImage}
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                />
                <button
                  type="button"
                  className={styles.previewRemove}
                  onClick={() => removeFile(index)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ImageUpload;
