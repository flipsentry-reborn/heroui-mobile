import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";

import { FilterBottomSheet } from "@/features/feed/filter-bottom-sheet";
import { FiltersLayoutPicker } from "@/features/feed/filters-layout-picker";
import { FiltersVariantAccordion } from "@/features/feed/filters-screen-variants/filters-variant-accordion";
import { FiltersVariantCards } from "@/features/feed/filters-screen-variants/filters-variant-cards";
import { FiltersVariantCompact } from "@/features/feed/filters-screen-variants/filters-variant-compact";
import { FiltersVariantSettings } from "@/features/feed/filters-screen-variants/filters-variant-settings";
import { FiltersVariantTabs } from "@/features/feed/filters-screen-variants/filters-variant-tabs";
import {
  FeedDisplayPrefsBar,
  FiltersHeader,
  FiltersSkeleton,
  useFiltersScreenController,
  type FiltersLayoutVariantId,
} from "@/features/feed/filters-screen-shared";

function FiltersVariantBody({
  variant,
  controller,
}: {
  variant: FiltersLayoutVariantId;
  controller: ReturnType<typeof useFiltersScreenController>;
}): JSX.Element {
  switch (variant) {
    case "cards":
      return <FiltersVariantCards controller={controller} />;
    case "tabs":
      return <FiltersVariantTabs controller={controller} />;
    case "settings":
      return <FiltersVariantSettings controller={controller} />;
    case "compact":
      return <FiltersVariantCompact controller={controller} />;
    case "accordion":
    default:
      return <FiltersVariantAccordion controller={controller} />;
  }
}

/** Manage saved filters and their feed/notification behavior. */
export const FiltersScreen = observer(function FiltersScreen({
  onBack,
}: {
  onBack: () => void;
}): JSX.Element {
  const controller = useFiltersScreenController();
  const [layoutVariant, setLayoutVariant] = useState<FiltersLayoutVariantId>("accordion");

  return (
    <View className="flex-1 bg-background">
      <FiltersHeader onBack={onBack} />
      <FiltersLayoutPicker value={layoutVariant} onChange={setLayoutVariant} />

      {controller.initialLoading ? (
        <View className="flex-1">
          <FiltersSkeleton />
        </View>
      ) : (
        <FiltersVariantBody variant={layoutVariant} controller={controller} />
      )}

      <FeedDisplayPrefsBar />

      {controller.sheetMounted ? (
        <FilterBottomSheet
          isOpen={controller.sheetOpen}
          onOpenChange={controller.handleSheetOpenChange}
          editingFilter={controller.editing}
        />
      ) : null}
    </View>
  );
});
