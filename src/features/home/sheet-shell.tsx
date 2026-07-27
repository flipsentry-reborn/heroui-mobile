import type { JSX, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "heroui-native";

/** Keep mounted long enough for gorhom to finish the close spring. */
const CLOSE_THEN_UNMOUNT_MS = 350;

/**
 * Portal only while mounted; open after mount so HeroUI snap works; unmount when closed.
 * Avoids the heroui-gorhom bug where a closed sheet still paints on screen.
 *
 * Prefer dismiss via `useBottomSheet().onOpenChange(false)` (or swipe/overlay) so the
 * sheet animates out, then this shell calls `onClose`.
 *
 * Parent-driven `visible={false}` also animates out before unmount (does not call
 * `onClose` again — the parent already closed).
 */
export function SheetShell({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const clearCloseTimer = () => {
    if (closeTimerRef.current == null) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const finishClose = (notifyParent: boolean) => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      mountedRef.current = false;
      setMounted(false);
      setIsOpen(false);
      if (notifyParent) {
        onCloseRef.current();
      }
    }, CLOSE_THEN_UNMOUNT_MS);
  };

  useEffect(() => {
    if (visible) {
      clearCloseTimer();
      mountedRef.current = true;
      setMounted(true);
      const id = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(id);
    }

    // Parent flipped visible off — animate out, then unmount (no second onClose).
    if (!mountedRef.current) return;
    setIsOpen(false);
    finishClose(false);
  }, [visible]);

  useEffect(() => () => clearCloseTimer(), []);

  if (!mounted) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          clearCloseTimer();
          setIsOpen(true);
          return;
        }
        setIsOpen(false);
        finishClose(true);
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        {children}
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
