import type { JSX } from "react";
import { Input, useBottomSheetAwareHandlers } from "heroui-native";

import { formatKeywordsLabel } from "@/features/home/search-bottom-sheet-keywords-sheet";
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

export interface SearchKeywordsState {
  includers: string[];
  excluders: string[];
  onOpenChange: (open: boolean) => void;
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
  keywords: SearchKeywordsState;
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
      variant="secondary"
      isInvalid={isInvalid}
      textAlign="right"
      className={`h-auto min-h-0 flex-1 border-0 bg-transparent px-0 py-0 text-[15px] shadow-none ios:outline-0 ios:focus:outline-transparent android:border-0 android:focus:border-transparent ${
        isInvalid ? "text-danger" : "text-foreground"
      }`}
      placeholderColorClassName="text-muted"
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
  keywords,
}: SearchBottomSheetCriteriaProps): JSX.Element {
  const hasSearchType = searchType != null;
  const isCustom = searchType === "custom";
  const priceLabel = formatPriceRangeLabel(price.min, price.max);
  const hasPriceFilter = price.min !== "" || price.max !== "";
  const keywordsLabel = formatKeywordsLabel(
    keywords.includers,
    keywords.excluders,
  );
  const hasKeywords =
    keywords.includers.length > 0 || keywords.excluders.length > 0;

  return (
    <SearchSheetGroup title="Criteria">
      {isCustom ? (
        <SearchSheetRow
          title="Search"
          required
          showSwap
          expandRight
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
        onPress={hasSearchType ? () => keywords.onOpenChange(true) : undefined}
        right={
          <SearchSheetValue
            label={keywordsLabel}
            isDisabled={!hasSearchType}
            emphasized={hasSearchType && hasKeywords}
          />
        }
      />
    </SearchSheetGroup>
  );
}
