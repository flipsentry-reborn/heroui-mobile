import { Ionicons } from "@expo/vector-icons";
import type { JSX, ReactNode } from "react";
import { useState } from "react";
import { Pressable, View } from "react-native";
import {
  ListGroup,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";

import { formatPriceRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetTypeSelect } from "@/features/home/search-bottom-sheet-type-select";
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
        <Pressable onPress={onPress}>
          <ListGroup.Item disabled className="py-3.5">
            {body}
          </ListGroup.Item>
        </Pressable>
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
  emphasized,
}: {
  label: string;
  showChevron?: boolean;
  isDisabled?: boolean;
  emphasized?: boolean;
}): JSX.Element {
  const [muted] = useThemeColor(["muted"]);

  return (
    <View
      className="flex-row items-center gap-1"
      style={isDisabled ? { opacity: 0.55 } : undefined}
    >
      <Typography
        type="body-sm"
        className={emphasized ? "text-foreground" : "text-muted"}
      >
        {label}
      </Typography>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={muted} />
      ) : null}
    </View>
  );
}

export interface SearchPriceState {
  min: string;
  max: string;
  onOpenChange: (open: boolean) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

interface SearchBottomSheetCriteriaProps {
  price: SearchPriceState;
}

export function SearchBottomSheetCriteria({
  price,
}: SearchBottomSheetCriteriaProps): JSX.Element {
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const hasSearchType = searchType != null;
  const priceLabel = formatPriceRangeLabel(price.min, price.max);
  const hasPriceFilter = price.min !== "" || price.max !== "";

  return (
    <View className="mb-5 mt-1 gap-2.5">
      <Typography type="body-xs" className="mx-5 text-muted">
        Criteria
      </Typography>

      <ListGroup className="mx-3">
        <CriteriaRow
          title="Search"
          required
          isLast={false}
          right={
            <SearchBottomSheetTypeSelect
              value={searchType}
              onChange={setSearchType}
            />
          }
        />
        <CriteriaRow
          title="Price"
          isLast={false}
          isDisabled={!hasSearchType}
          onPress={
            hasSearchType ? () => price.onOpenChange(true) : undefined
          }
          right={
            <CriteriaValue
              label={hasSearchType ? priceLabel : "Any - Any"}
              isDisabled={!hasSearchType}
              emphasized={hasSearchType && hasPriceFilter}
            />
          }
        />
        <CriteriaRow
          title="Keywords"
          isLast
          isDisabled={!hasSearchType}
          onPress={hasSearchType ? () => {} : undefined}
          right={<CriteriaValue label="None" isDisabled={!hasSearchType} />}
        />
      </ListGroup>
    </View>
  );
}
