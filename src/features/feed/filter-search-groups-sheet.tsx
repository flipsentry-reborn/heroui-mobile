import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Checkbox,
  ControlField,
  Separator,
  Typography,
  useBottomSheet,
} from "heroui-native";
import { Badge } from "heroui-native-pro";
import { withUniwind } from "uniwind";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import type { SearchGroup } from "@/mocks/data/home";
import {
  cityFromLocation,
  groupStatus,
  isGroupPaused,
} from "@/mocks/services/home";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

/**
 * Home-card title for Custom filter search-group picker.
 * iPhone = "Iphones" (never model list); Custom = query / customLabel.
 */
export function customFilterSearchGroupTitle(group: SearchGroup): string {
  if (group.searchType === "iphone") return "Iphones";
  return group.customLabel?.trim() || "Custom search";
}

/** Non-car groups for the picker — active first, then paused. */
export function listCustomFilterGroups(groups: SearchGroup[]): SearchGroup[] {
  const nonCar = groups.filter((group) => group.searchType !== "car");
  return [...nonCar].sort((a, b) => {
    const aPaused = isGroupPaused(a) ? 1 : 0;
    const bPaused = isGroupPaused(b) ? 1 : 0;
    if (aPaused !== bPaused) return aPaused - bPaused;
    return (
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  });
}

/** @deprecated Prefer listCustomFilterGroups — kept for call sites that want active-only. */
export function selectableCustomFilterGroups(
  groups: SearchGroup[],
): SearchGroup[] {
  return listCustomFilterGroups(groups).filter((group) => !isGroupPaused(group));
}

function uniquePlatforms(
  settings: SearchGroup["settings"],
): { platform: string; isActive: boolean }[] {
  const seen = new Map<string, boolean>();
  for (const setting of settings) {
    const prev = seen.get(setting.platform);
    seen.set(setting.platform, (prev ?? false) || setting.isActive);
  }
  return [...seen.entries()].map(([platform, isActive]) => ({
    platform,
    isActive,
  }));
}

function locationRadiusLabel(group: SearchGroup): string {
  return `${cityFromLocation(group.locationName)} · ${group.radiusMiles} mi`;
}

function statusBadgeColor(
  tone: ReturnType<typeof groupStatus>["tone"],
): "success" | "warning" | "danger" {
  if (tone === "success") return "success";
  if (tone === "danger") return "danger";
  return "warning";
}

export function formatSearchGroupsLabel(
  selectedIds: string[],
  groups: SearchGroup[],
): string {
  if (selectedIds.length === 0) return "Required";
  const byId = new Map(groups.map((group) => [group.id, group]));
  const titles = selectedIds
    .map((id) => {
      const group = byId.get(id);
      return group != null ? customFilterSearchGroupTitle(group) : null;
    })
    .filter((title): title is string => title != null);
  if (titles.length === 0) {
    return selectedIds.length === 1 ? "1 search" : `${selectedIds.length} searches`;
  }
  if (titles.length <= 2) return titles.join(", ");
  return `${titles.length} searches`;
}

function GroupRowContent({
  group,
}: {
  group: SearchGroup;
}): JSX.Element {
  const title = customFilterSearchGroupTitle(group);
  const status = groupStatus(group);
  const platforms = uniquePlatforms(group.settings);

  return (
    <View className="min-w-0 flex-1 gap-1.5">
      <View className="flex-row items-center gap-2">
        <Typography
          type="body"
          className="min-w-0 flex-1 text-foreground"
          numberOfLines={1}
        >
          {title}
        </Typography>
        <Badge color={statusBadgeColor(status.tone)} variant="soft" size="sm">
          {status.label}
        </Badge>
      </View>
      <View className="flex-row items-center gap-2">
        {platforms.length > 0 ? (
          <View className="flex-row items-center gap-1.5">
            {platforms.map((p) => (
              <View
                key={p.platform}
                className={p.isActive ? "opacity-100" : "opacity-35"}
              >
                <PlatformIcon platform={p.platform} size={16} />
              </View>
            ))}
          </View>
        ) : null}
        <Typography type="body-xs" className="min-w-0 flex-1 text-muted" numberOfLines={1}>
          {locationRadiusLabel(group)}
        </Typography>
      </View>
    </View>
  );
}

function SearchGroupsSheetContent({
  groups,
  selectedIds,
  onSelectedIdsChange,
}: {
  groups: SearchGroup[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [draft, setDraft] = useState(selectedIds);
  const snapPoints = useMemo(() => ["55%", "80%"], []);
  const dismiss = () => onOpenChange(false);
  const selectedSet = useMemo(() => new Set(draft), [draft]);
  const canSave = draft.length > 0;

  useEffect(() => {
    setDraft(selectedIds);
  }, [selectedIds]);

  const toggleActive = (groupId: string, selected: boolean) => {
    setDraft((current) => {
      if (selected) {
        return current.includes(groupId) ? current : [...current, groupId];
      }
      return current.filter((id) => id !== groupId);
    });
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableOverDrag={false}
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
    >
      <View className="flex-1">
        <SearchBottomSheetHeader
          title="Search groups"
          onCancel={dismiss}
          onSave={() => {
            if (!canSave) return;
            onSelectedIdsChange(draft);
            dismiss();
          }}
          saveDisabled={!canSave}
        />

        {groups.length === 0 ? (
          <View className="mx-3 mb-6 rounded-3xl bg-surface px-4 py-4">
            <Typography type="body-sm" className="text-muted">
              No iPhone or Custom searches yet. Create one on Home first.
            </Typography>
          </View>
        ) : (
          <StyledBottomSheetScrollView className="flex-1">
            <View className="mx-3 mb-6 overflow-hidden rounded-3xl bg-surface shadow-surface">
              {groups.map((group, index) => {
                const paused = isGroupPaused(group);
                const isLast = index === groups.length - 1;
                const title = customFilterSearchGroupTitle(group);

                return (
                  <View key={group.id}>
                    <ControlField
                      isSelected={selectedSet.has(group.id)}
                      onSelectedChange={
                        paused
                          ? undefined
                          : (selected) => toggleActive(group.id, selected)
                      }
                      isDisabled={paused}
                      className={`items-center gap-3 px-4 py-3.5 ${
                        paused ? "opacity-55" : "opacity-100"
                      }`}
                      accessibilityLabel={
                        paused ? `${title}, paused` : title
                      }
                    >
                      <GroupRowContent group={group} />
                      <ControlField.Indicator>
                        <Checkbox />
                      </ControlField.Indicator>
                    </ControlField>
                    {!isLast ? <Separator className="mx-4 bg-muted/40" /> : null}
                  </View>
                );
              })}
            </View>
          </StyledBottomSheetScrollView>
        )}
      </View>
    </BottomSheet.Content>
  );
}

interface FilterSearchGroupsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groups: SearchGroup[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
}

export function FilterSearchGroupsSheet({
  isOpen,
  onOpenChange,
  groups,
  selectedIds,
  onSelectedIdsChange,
}: FilterSearchGroupsSheetProps): JSX.Element {
  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <SearchGroupsSheetContent
        key={isOpen ? selectedIds.join("|") || "empty" : "closed"}
        groups={groups}
        selectedIds={selectedIds}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    </SheetShell>
  );
}
