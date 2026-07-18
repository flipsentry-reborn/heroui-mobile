import type { JSX } from "react";
import { Input, useBottomSheetAwareHandlers } from "heroui-native";

import {
  formatCarMakesLabel,
  type CarMakesSelection,
} from "@/features/home/search-bottom-sheet-car-makes-sheet";
import {
  formatIphoneModelsLabel,
  type IphoneModelSelection,
} from "@/features/home/search-bottom-sheet-iphone-models-sheet";
import {
  formatKeywordsLabel,
  type KeywordsState,
} from "@/features/home/search-bottom-sheet-keywords-sheet";
import {
  formatGroupedDigits,
  formatPriceRangeLabel,
} from "@/features/home/search-bottom-sheet-price-sheet";
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

export interface SearchYearState {
  min: string;
  max: string;
  onOpenChange: (open: boolean) => void;
}

export interface SearchMileageState {
  min: string;
  max: string;
  onOpenChange: (open: boolean) => void;
}

export interface SearchKeywordsState {
  value: KeywordsState;
  onOpenChange: (open: boolean) => void;
}

export interface SearchIphoneModelsState {
  selections: IphoneModelSelection[];
  onOpenChange: (open: boolean) => void;
}

export interface SearchCarMakesState {
  selection: CarMakesSelection;
  onOpenChange: (open: boolean) => void;
}

export function isCustomSearchQueryValid(query: string): boolean {
  return query.trim().length >= 2;
}

interface SearchBottomSheetCriteriaProps {
  searchType: SearchType | null;
  customQuery: string;
  onCustomQueryChange: (value: string) => void;
  iphoneModels: SearchIphoneModelsState;
  carMakes: SearchCarMakesState;
  price: SearchPriceState;
  year: SearchYearState;
  mileage: SearchMileageState;
  keywords: SearchKeywordsState;
}

function CustomSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  const isInvalid = !isCustomSearchQueryValid(value);

  return (
    <Input
      value={value}
      onChangeText={onChange}
      placeholder="Required"
      variant="secondary"
      isInvalid={isInvalid}
      textAlign="right"
      className={`h-auto min-h-0 flex-1 border-0 bg-transparent px-0 py-0 text-[15px] shadow-none ios:outline-0 ios:focus:outline-transparent android:border-0 android:focus:border-transparent ${
        isInvalid ? "text-danger" : "text-foreground"
      }`}
      placeholderColorClassName={isInvalid ? "text-danger" : "text-muted"}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

export function SearchBottomSheetCriteria({
  searchType,
  customQuery,
  onCustomQueryChange,
  iphoneModels,
  carMakes,
  price,
  year,
  mileage,
  keywords,
}: SearchBottomSheetCriteriaProps): JSX.Element {
  const hasSearchType = searchType != null;
  const isCustom = searchType === "custom";
  const isIphone = searchType === "iphone";
  const isCar = searchType === "car";
  const priceLabel = formatPriceRangeLabel(price.min, price.max);
  const hasPriceFilter = price.min !== "" || price.max !== "";
  const yearLabel = formatPriceRangeLabel(year.min, year.max);
  const hasYearFilter = year.min !== "" || year.max !== "";
  const mileageLabel = formatPriceRangeLabel(
    formatGroupedDigits(mileage.min),
    formatGroupedDigits(mileage.max),
  );
  const hasMileageFilter = mileage.min !== "" || mileage.max !== "";
  const modelsLabel = formatIphoneModelsLabel(iphoneModels.selections);
  const hasModels = iphoneModels.selections.length > 0;
  const makesLabel = formatCarMakesLabel(carMakes.selection);
  const hasSpecificMakes =
    !carMakes.selection.anyMake && carMakes.selection.selectedIds.length > 0;
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
      {isCar ? (
        <SearchSheetRow
          title="Makes"
          isLast={false}
          onPress={() => carMakes.onOpenChange(true)}
          right={
            <SearchSheetValue
              label={makesLabel}
              emphasized={hasSpecificMakes}
            />
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
      {isCar ? (
        <SearchSheetRow
          title="Year"
          isLast={false}
          onPress={() => year.onOpenChange(true)}
          right={
            <SearchSheetValue label={yearLabel} emphasized={hasYearFilter} />
          }
        />
      ) : null}
      {isCar ? (
        <SearchSheetRow
          title="Mileage"
          isLast={false}
          onPress={() => mileage.onOpenChange(true)}
          right={
            <SearchSheetValue
              label={mileageLabel}
              emphasized={hasMileageFilter}
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
