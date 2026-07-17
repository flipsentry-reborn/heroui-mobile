import type { JSX } from "react";
import { Input, useBottomSheetAwareHandlers } from "heroui-native";

import {
  formatIphoneModelsLabel,
  type IphoneModelSelection,
} from "@/features/home/search-bottom-sheet-iphone-models-sheet";
import {
  formatKeywordsLabel,
  type KeywordsState,
} from "@/features/home/search-bottom-sheet-keywords-sheet";
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
  value: KeywordsState;
  onOpenChange: (open: boolean) => void;
}

export interface SearchIphoneModelsState {
  selections: IphoneModelSelection[];
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
  iphoneModels: SearchIphoneModelsState;
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
  iphoneModels,
  price,
  keywords,
}: SearchBottomSheetCriteriaProps): JSX.Element {
  const hasSearchType = searchType != null;
  const isCustom = searchType === "custom";
  const isIphone = searchType === "iphone";
  const priceLabel = formatPriceRangeLabel(price.min, price.max);
  const hasPriceFilter = price.min !== "" || price.max !== "";
  const modelsLabel = formatIphoneModelsLabel(iphoneModels.selections);
  const hasModels = iphoneModels.selections.length > 0;
  const keywordsLabel = formatKeywordsLabel(keywords.value);
  const hasKeywords = keywordsLabel !== "None";

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
      {isIphone ? (
        <SearchSheetRow
          title="Models"
          required
          isLast={false}
          onPress={() => iphoneModels.onOpenChange(true)}
          right={
            <SearchSheetValue label={modelsLabel} emphasized={hasModels} />
          }
        />
      ) : null}
      {!isIphone ? (
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
      ) : null}
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
