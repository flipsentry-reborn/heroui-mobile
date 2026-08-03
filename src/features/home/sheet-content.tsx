import type { ComponentProps, JSX } from "react";
import { BottomSheet } from "heroui-native";

type SheetContentProps = ComponentProps<typeof BottomSheet.Content>;

/**
 * App-wide BottomSheet.Content defaults.
 * Content panning is off so nested sliders / lists / presses feel right;
 * dismiss still works via handle, overlay, and swipe on the sheet chrome.
 */
export function SheetContent({
  enableContentPanningGesture = false,
  ...props
}: SheetContentProps): JSX.Element {
  return (
    <BottomSheet.Content
      enableContentPanningGesture={enableContentPanningGesture}
      {...props}
    />
  );
}
