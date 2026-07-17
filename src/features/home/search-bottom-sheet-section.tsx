import type { JSX, ReactNode } from "react";

import { SearchSheetGroup } from "@/features/home/search-sheet-group";

interface SearchBottomSheetSectionProps {
  children: ReactNode;
}

/** Settings-style ListGroup shell for New Search sheet rows. */
export function SearchBottomSheetSection({
  children,
}: SearchBottomSheetSectionProps): JSX.Element {
  return <SearchSheetGroup>{children}</SearchSheetGroup>;
}
