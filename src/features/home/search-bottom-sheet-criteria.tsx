import type { JSX } from "react";

import { formatPriceRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import {
  SearchSheetGroup,
  SearchSheetRow,
  SearchSheetValue,
} from "@/features/home/search-sheet-group";

export interface SearchPriceState {
  min: string;
  max: string;
  onOpenChange: (open: boolean) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

interface SearchBottomSheetCriteriaProps {
  hasSearchType: boolean;
  price: SearchPriceState;
}

export function SearchBottomSheetCriteria({
  hasSearchType,
  price,
}: SearchBottomSheetCriteriaProps): JSX.Element {
  const priceLabel = formatPriceRangeLabel(price.min, price.max);
  const hasPriceFilter = price.min !== "" || price.max !== "";

  return (
    <SearchSheetGroup title="Criteria">
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
