import { Ionicons } from "@expo/vector-icons";
import type { JSX, ReactNode } from "react";
import { useState } from "react";
import { View } from "react-native";
import {
  ListGroup,
  PressableFeedback,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";

import { SearchBottomSheetTypeFab } from "@/features/home/search-bottom-sheet-type-fab";
import type { SearchType } from "@/mocks/data/home";

function CriteriaRow({
  title,
  required,
  showSwap,
  isLast,
  isDisabled,
  onPress,
  right,
}: {
  title: string;
  required?: boolean;
  showSwap?: boolean;
  isLast: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
  right: ReactNode;
}): JSX.Element {
  const [muted, danger] = useThemeColor(["muted", "danger"]);
  const interactive = onPress != null && !isDisabled;

  const body = (
    <>
      <ListGroup.ItemContent>
        <View className="flex-row items-center gap-1">
          <ListGroup.ItemTitle
            className={`text-[15px] font-normal ${
              isDisabled ? "text-muted" : "text-foreground"
            }`}
          >
            {title}
          </ListGroup.ItemTitle>
          {showSwap ? (
            <Ionicons
              name="swap-vertical"
              size={14}
              color={muted}
              style={isDisabled ? { opacity: 0.5 } : undefined}
            />
          ) : null}
          {required ? (
            <Typography
              type="body-sm"
              style={{ color: danger, opacity: isDisabled ? 0.5 : 1 }}
            >
              *
            </Typography>
          ) : null}
        </View>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>{right}</ListGroup.ItemSuffix>
    </>
  );

  return (
    <>
      {interactive ? (
        <PressableFeedback animation={false} onPress={onPress}>
          <PressableFeedback.Scale>
            <ListGroup.Item disabled className="py-3.5">
              {body}
            </ListGroup.Item>
          </PressableFeedback.Scale>
          <PressableFeedback.Highlight />
          <PressableFeedback.Ripple />
        </PressableFeedback>
      ) : (
        <ListGroup.Item
          disabled
          className={`py-3.5 ${isDisabled ? "opacity-45" : ""}`}
        >
          {body}
        </ListGroup.Item>
      )}
      {!isLast ? <Separator className="mx-4 bg-muted/40" /> : null}
    </>
  );
}

function CriteriaValue({
  label,
  showChevron = true,
  isDisabled,
}: {
  label: string;
  showChevron?: boolean;
  isDisabled?: boolean;
}): JSX.Element {
  const [muted] = useThemeColor(["muted"]);

  return (
    <View
      className="flex-row items-center gap-1"
      style={isDisabled ? { opacity: 0.55 } : undefined}
    >
      <Typography type="body-sm" className="text-muted">
        {label}
      </Typography>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={muted} />
      ) : null}
    </View>
  );
}

export function SearchBottomSheetCriteria(): JSX.Element {
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const [typeFabOpen, setTypeFabOpen] = useState(false);
  const hasSearchType = searchType != null;

  return (
    <View className="mb-5 mt-1 gap-2.5">
      <Typography type="body-xs" className="mx-5 text-muted">
        Criteria
      </Typography>

      <ListGroup className="mx-3">
        <CriteriaRow
          title="Search"
          required
          showSwap
          isLast={false}
          onPress={() => setTypeFabOpen(true)}
          right={
            <SearchBottomSheetTypeFab
              value={searchType}
              isOpen={typeFabOpen}
              onOpenChange={setTypeFabOpen}
              onChange={(type) => {
                setSearchType(type);
                setTypeFabOpen(false);
              }}
            />
          }
        />
        <CriteriaRow
          title="Price"
          isLast={false}
          isDisabled={!hasSearchType}
          onPress={hasSearchType ? () => {} : undefined}
          right={
            <CriteriaValue label="None" isDisabled={!hasSearchType} />
          }
        />
        <CriteriaRow
          title="Keywords"
          isLast
          isDisabled={!hasSearchType}
          onPress={hasSearchType ? () => {} : undefined}
          right={
            <CriteriaValue label="None" isDisabled={!hasSearchType} />
          }
        />
      </ListGroup>
    </View>
  );
}
