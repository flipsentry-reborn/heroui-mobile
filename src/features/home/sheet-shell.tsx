import type { JSX, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
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
 *
 * Open is deferred past press/menu/scroll interactions + two frames so dynamic
 * sizing can measure content (immediate open from in-scroll buttons often snaps short).
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
  const openRaf1Ref = useRef<number | null>(null);
  const openRaf2Ref = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const clearCloseTimer = () => {
    if (closeTimerRef.current == null) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const clearOpenRafs = () => {
    if (openRaf1Ref.current != null) {
      cancelAnimationFrame(openRaf1Ref.current);
      openRaf1Ref.current = null;
    }
    if (openRaf2Ref.current != null) {
      cancelAnimationFrame(openRaf2Ref.current);
      openRaf2Ref.current = null;
    }
  };

  const finishClose = (notifyParent: boolean) => {
    clearCloseTimer();
    clearOpenRafs();
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
      clearOpenRafs();
      mountedRef.current = true;
      setMounted(true);
      const task = InteractionManager.runAfterInteractions(() => {
        openRaf1Ref.current = requestAnimationFrame(() => {
          openRaf1Ref.current = null;
          openRaf2Ref.current = requestAnimationFrame(() => {
            openRaf2Ref.current = null;
            setIsOpen(true);
          });
        });
      });
      return () => {
        task.cancel();
        clearOpenRafs();
      };
    }

    // Parent flipped visible off — animate out, then unmount (no second onClose).
    if (!mountedRef.current) return;
    setIsOpen(false);
    finishClose(false);
  }, [visible]);

  useEffect(
    () => () => {
      clearCloseTimer();
      clearOpenRafs();
    },
    [],
  );

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
