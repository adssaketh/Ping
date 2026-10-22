import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { fileToSourceDataUrl } from '../utils/profilePhoto.ts';
import { profilePhotoEditor, PhotoTarget } from '../utils/profilePhotoEditor.ts';
import { useBackHandler } from '../backStack.ts';
import { spring, fadeFast } from '../motion.ts';

const OUTPUT = 256; // saved picture size in pixels
const MAX_ZOOM = 4;

interface CropperProps {
  source: string;
  onCancel: () => void;
  onSave: (cropped: string) => void;
  /** Business logos may be zoomed out to fit completely (white around them) */
  allowZoomOut?: boolean;
}

/** Move, zoom and rotate the photo under a circular guide, then save. */
const PhotoCropper: React.FC<CropperProps> = ({ source, onCancel, onSave, allowZoomOut = false }) => {
  const MIN_ZOOM = allowZoomOut ? 0.4 : 1;
  const size = useRef(Math.max(220, Math.min(320, window.innerWidth - 64))).current;
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0 / 90 / 180 / 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = source;
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, [source]);

  // The photo must always cover the whole guide, so work out how far it may be moved
  const quarterTurn = rotation % 180 !== 0;
  const shownW = img ? (quarterTurn ? img.naturalHeight : img.naturalWidth) : 1;
  const shownH = img ? (quarterTurn ? img.naturalWidth : img.naturalHeight) : 1;
  const scale = (size / Math.min(shownW, shownH)) * zoom;
  const maxX = Math.max(0, (shownW * scale - size) / 2);
  const maxY = Math.max(0, (shownH * scale - size) / 2);
  const clampX = (v: number) => Math.max(-maxX, Math.min(maxX, v));
  const clampY = (v: number) => Math.max(-maxY, Math.min(maxY, v));
  const x = clampX(offset.x);
  const y = clampY(offset.y);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values()) as { x: number; y: number }[];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values()) as { x: number; y: number }[];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinch.current.zoom * (distance / pinch.current.distance))));
    } else {
      const dx = e.clientX - previous.x;
      const dy = e.clientY - previous.y;
      setOffset({ x: clampX(x + dx), y: clampY(y + dy) });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const save = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const k = OUTPUT / size;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.translate(OUTPUT / 2, OUTPUT / 2);
    ctx.translate(x * k, y * k);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale * k, scale * k);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    onSave(canvas.toDataURL('image/jpeg', 0.88));
  };

  const reset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative overflow-hidden rounded-[28px] select-none ${allowZoomOut ? 'bg-white' : 'bg-black'}`}
        style={{ width: size, height: size, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={(e) => setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z - e.deltaY * 0.002)))}
      >
        {img && (
          <img
            src={source}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: img.naturalWidth,
              height: img.naturalHeight,
              maxWidth: 'none',
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
              willChange: 'transform',
            }}
          />
        )}
        {/* circular guide: everything outside it is dimmed */}
        <div
          className="absolute inset-3 rounded-full pointer-events-none border-2 border-white/80"
          style={{ boxShadow: '0 0 0 999px rgba(0,0,0,0.5)' }}
        />
      </div>

      <div className="mt-5 w-full flex items-center gap-3 px-1">
        <ZoomOut className="w-5 h-5 text-m3-variant dark:text-m3-variant-dk shrink-0" />
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          aria-label="Zoom"
          className="flex-1 accent-m3-primary"
        />
        <ZoomIn className="w-5 h-5 text-m3-variant dark:text-m3-variant-dk shrink-0" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 270) % 360)}
          className="p-3 rounded-full bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk"
          aria-label="Rotate left"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="p-3 rounded-full bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk"
          aria-label="Rotate right"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-3 rounded-full text-xs font-semibold bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 w-full flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-full text-sm font-semibold bg-m3-surface-hi dark:bg-m3-d3 text-m3-variant dark:text-m3-variant-dk"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!img}
          className="flex-1 py-3 rounded-full text-sm font-semibold bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
};

/** Lives once in App: opens the photo picker and the editor when any screen asks for it. */
export const ProfilePhotoEditor: React.FC = () => {
  const { settings, updateSettings, getContactPhoto, setBusinessPhoto } = useSMS();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [target, setTarget] = useState<PhotoTarget>({ type: 'profile' });
  const latest = useRef({ settings, getContactPhoto });
  latest.current = { settings, getContactPhoto };

  useEffect(
    () =>
      profilePhotoEditor.subscribe((action, t) => {
        setTarget(t);
        const existing =
          t.type === 'business'
            ? latest.current.getContactPhoto(t.key)
            : latest.current.settings.profilePhotoSource || latest.current.settings.profilePhoto;
        if (action === 'edit' && existing) setSource(existing);
        else inputRef.current?.click();
      }),
    []
  );

  useBackHandler(source !== null, () => setSource(null));

  const handlePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setSource(await fileToSourceDataUrl(file));
    } catch (err) {
      console.warn('Profile picture failed:', err);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" onChange={handlePicked} className="hidden" />
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {source && (
              <motion.div
                key="photo-editor"
                className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeFast}
              >
                <div className="fixed inset-0 bg-black/60" onClick={() => setSource(null)} />
                <motion.div
                  role="dialog"
                  aria-label="Edit profile picture"
                  className="relative w-full sm:max-w-sm bg-white dark:bg-m3-d2 rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-5 pb-6"
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 60, opacity: 0 }}
                  transition={spring}
                >
                  <h3 className="text-base font-semibold text-center mb-4 text-m3-on-surface dark:text-white">
                    {target.type === 'business' ? `Picture for ${target.name}` : 'Edit picture'}
                  </h3>
                  <PhotoCropper
                    source={source}
                    allowZoomOut={target.type === 'business'}
                    onCancel={() => setSource(null)}
                    onSave={(cropped) => {
                      if (target.type === 'business') setBusinessPhoto(target.key, cropped);
                      else updateSettings({ profilePhoto: cropped, profilePhotoSource: source });
                      setSource(null);
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
