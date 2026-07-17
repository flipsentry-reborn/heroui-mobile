import type { JSX } from "react";
import { Input, useBottomSheetAwareHandlers } from "heroui-native";

import { formatPriceRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import {
  SearchSheetGroup,
  SearchSheetRow,
  SearchSheetValue,
} from "@/features/home/search-sheet-group";
import type { SearchType } from "@/mocks/data/home";

export interface SearchPriceState {
  min: string;
  max: string;
  onOpenChange: (open: boolean) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export function isCustomSearchQueryValid(query: string): boolean {
  return query.trim().length >= 1;
}

interface SearchBottomSheetCriteriaProps {
  searchType: SearchType | null;
  customQuery: string;
  onCustomQueryChange: (value: string) => void;
  customQueryInvalid?: boolean;
  price: SearchPriceState;
}

function CustomSearchInput({
  value,
  onChange,
  isInvalid,
}: {
  value: string;
  onChange: (value: string) => void;
  isInvalid: boolean;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <Input
      value={value}
      onChangeText={onChange}
      placeholder="Empty"
      variant="primary"
      isInvalid={isInvalid}
      className="h-8 min-h-8 w-40 px-2 py-0 text-sm text-foreground"
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

export function SearchBottomSheetCriteria({
  searchType,
  customQuery,
  onCustomQueryChange,
  customQueryInvalid = false,
  price,
}: SearchBottomSheetCriteriaProps): JSX.Element {
  const hasSearchType = searchType != null;
  const isCustom = searchType === "custom";
  const priceLabel = formatPriceRangeLabel(price.min, price.max);
  const hasPriceFilter = price.min !== "" || price.max !== "";

  return (
    <SearchSheetGroup title="Criteria">
      {isCustom ? (
        <SearchSheetRow
          title="Search"
          required
          isLast={false}
          right={
            <CustomSearchInput
              value={customQuery}
              onChange={onCustomQueryChange}
              isInvalid={customQueryInvalid}
            />
          }
        />
      ) : null}
      <SearchSheetRow
        title="Price"
        isLast={false}
        isDisabled={!hasSearchType}
        onPress={hasSearchType ? () => price.onOpenChange(true) : undefined}
        right={
          <SearchSheetValue
            label={priceLabel}
            isDisabled={!hasSearchType}
            emphasized={hasSearchType && hasPriceFilter}
          />
        }
      />
      <SearchSheetRow
        title="Keywords"
        isLast
        isDisabled={!hasSearchType}
        onPress={hasSearchType ? () => {} : undefined}
        right={<SearchSheetValue label="None" isDisabled={!hasSearchType} />}
      />
    </SearchSheetGroup>
  );
}
