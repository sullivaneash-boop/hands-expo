import type { ReactNode } from 'react';

/** Bottom sheet over the board. Tapping the backdrop closes it. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/55" aria-label="Close" onClick={onClose} />
      <div className="anim-bubble-in relative max-h-[78%] overflow-y-auto rounded-t-xl border-t-2 border-amber bg-night px-4 pt-3 pb-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-bold tracking-widest text-paper">{title}</div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center text-xl text-tile"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
