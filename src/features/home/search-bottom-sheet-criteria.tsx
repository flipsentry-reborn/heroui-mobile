import type { JSX } from "react";
import { useState } from "react";

import { formatPriceRangeLabel } from "@/features/home/search-bottom-sheet-price-sheet";
import { SearchBottomSheetTypeSelect } from "@/features/home/search-bottom-sheet-type-select";
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
    <SearchSheetGroup title="Criteria">
      <SearchSheetRow
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
      <SearchSheetRow
        title="Price"
        isLast={false}
        isDisabled={!hasSearchType}
        onPress={hasSearchType ? () => price.onOpenChange(true) : undefined}
        right={
          <SearchSheetValue
            label={hasSearchType ? priceLabel : "Any - Any"}
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
