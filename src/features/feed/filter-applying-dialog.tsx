import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { View } from "react-native";
import { Dialog, Spinner, useThemeColor } from "heroui-native";

import { useStore } from "@/store/store";

/** Non-dismissable overlay while feed clears + refetches after filter changes. */
export const FilterApplyingDialog = observer(
  function FilterApplyingDialog(): JSX.Element {
    const { feedStore } = useStore();
    const isOpen = feedStore.isApplyingFilters;
    const accent = useThemeColor("accent");

    return (
      <Dialog
        isOpen={isOpen}
        onOpenChange={() => {
          // Non-dismissable — ignore overlay / swipe close while applying.
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay isCloseOnPress={false} />
          <Dialog.Content
            isSwipeable={false}
            className="mx-5 w-auto max-w-sm gap-4 bg-surface"
          >
            <View className="items-center gap-3 px-2 py-2">
              <Spinner size="lg" color={accent} />
              <View className="gap-1.5">
                <Dialog.Title className="text-center">
                  Applying filters…
                </Dialog.Title>
                <Dialog.Description className="text-center">
                  Updating your feed to match the new filters.
                </Dialog.Description>
              </View>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    );
  },
);
