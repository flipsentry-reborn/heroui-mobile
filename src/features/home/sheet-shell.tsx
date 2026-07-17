import type { JSX, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "heroui-native";

/** Keep `visible` true long enough for gorhom to finish the close spring. */
const CLOSE_THEN_UNMOUNT_MS = 350;

/**
 * Portal only while visible; open after mount so HeroUI snap works; unmount when closed.
 * Avoids the heroui-gorhom bug where a closed sheet still paints on screen.
 *
 * Dismiss via `useBottomSheet().onOpenChange(false)` (or swipe/overlay) so the sheet
 * can animate out before this shell calls `onClose` and unmounts.
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
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current == null) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  useEffect(() => {
    if (!visible) {
      clearCloseTimer();
      setIsOpen(false);
      return;
    }
    clearCloseTimer();
    const id = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  useEffect(() => () => clearCloseTimer(), []);

  if (!visible) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          clearCloseTimer();
          return;
        }
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
          closeTimerRef.current = null;
          onClose();
        }, CLOSE_THEN_UNMOUNT_MS);
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        {children}
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
