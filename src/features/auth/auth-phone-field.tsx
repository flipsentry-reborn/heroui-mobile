import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  BottomSheet,
  FieldError,
  InputGroup,
  SearchField,
  TextField,
  Typography,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import {
  AUTH_CONTROL_BACKGROUND,
  AUTH_PLACEHOLDER_COLOR,
} from "@/features/auth/auth-theme";
import { Fonts } from "@/lib/fonts";
import {
  COUNTRY_DIAL_CODES,
  findCountryByIso2,
  type CountryDialCode,
} from "@/mocks/data/country-dial-codes";

const StyledBottomSheetFlatList = withUniwind(BottomSheetFlatList);

interface AuthPhoneFieldProps {
  label?: string;
  nationalNumber: string;
  onNationalNumberChange: (value: string) => void;
  callingCode: string;
  onCallingCodeChange: (dialCode: string) => void;
  countryIso2?: string;
  onCountryIso2Change?: (iso2: string) => void;
  error?: string;
  placeholder?: string;
}

/** Phone row with country-code prefix inside HeroUI InputGroup (app field tokens). */
export function AuthPhoneField({
  label = "Phone Number",
  nationalNumber,
  onNationalNumberChange,
  callingCode,
  onCallingCodeChange,
  countryIso2 = "US",
  onCountryIso2Change,
  error,
  placeholder = "Phone number",
}: AuthPhoneFieldProps): JSX.Element {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  const selected =
    findCountryByIso2(countryIso2) ??
    COUNTRY_DIAL_CODES.find((c) => c.dialCode === callingCode) ??
    COUNTRY_DIAL_CODES.find((c) => c.iso2 === "US")!;

  const handleSelect = (country: CountryDialCode) => {
    onCallingCodeChange(country.dialCode);
    onCountryIso2Change?.(country.iso2);
    setPickerOpen(false);
  };

  return (
    <>
      <TextField isInvalid={!!error}>
        <Text
          style={{
            fontFamily: Fonts.headingSemi,
            fontSize: 14,
            lineHeight: 20,
            color: foreground,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
        <InputGroup>
          <InputGroup.Prefix>
            <Pressable
              onPress={() => setPickerOpen(true)}
              hitSlop={8}
              className="flex-row items-center gap-1 pr-1"
              accessibilityRole="button"
              accessibilityLabel="Select country code"
            >
              <Text style={{ fontSize: 16 }}>{selected.flag}</Text>
              <Text
                style={{
                  fontFamily: Fonts.headingSemi,
                  fontSize: 14,
                  lineHeight: 20,
                  color: foreground,
                }}
              >
                +{selected.dialCode}
              </Text>
              <Ionicons name="chevron-down" size={14} color={muted} />
            </Pressable>
          </InputGroup.Prefix>
          <InputGroup.Input
            className="h-12 rounded-2xl border-transparent text-foreground shadow-none"
            style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
            value={nationalNumber}
            onChangeText={(text) =>
              onNationalNumberChange(text.replace(/[^\d]/g, "").slice(0, 10))
            }
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            maxLength={10}
            placeholder={placeholder}
            placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </InputGroup>
        {error ? <FieldError>{error}</FieldError> : null}
      </TextField>

      <CountryDialCodeSheet
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedIso2={selected.iso2}
        onSelect={handleSelect}
      />
    </>
  );
}

function CountryDialCodeSheet({
  isOpen,
  onOpenChange,
  selectedIso2,
  onSelect,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIso2: string;
  onSelect: (country: CountryDialCode) => void;
}): JSX.Element | null {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_DIAL_CODES;
    return COUNTRY_DIAL_CODES.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.dialCode.includes(q.replace(/^\+/, "")) ||
        `+${c.dialCode}`.includes(q)
      );
    });
  }, [query]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <BottomSheet.Content
        snapPoints={["85%"]}
        enableDynamicSizing={false}
        enableOverDrag={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        className={SHEET_CONTENT_CLASS_NAME}
        backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
        handleComponent={null}
        contentContainerClassName={SHEET_CONTENT_CONTAINER_FULL_CLASS_NAME}
      >
        <View className="flex-1">
          <View className="items-center px-5 pb-2 pt-4">
            <Typography type="body" weight="normal">
              Country code
            </Typography>
          </View>

          <View className="px-3 pb-2">
            <SearchField value={query} onChange={setQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search country or code" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </View>

          <StyledBottomSheetFlatList
            data={filtered}
            keyExtractor={(item) => (item as CountryDialCode).iso2}
            keyboardShouldPersistTaps="handled"
            className="flex-1"
            contentContainerClassName="px-2 pb-8"
            renderItem={({ item }) => {
              const country = item as CountryDialCode;
              const selected = country.iso2 === selectedIso2;
              return (
                <Pressable
                  onPress={() => onSelect(country)}
                  className="flex-row items-center gap-3 rounded-2xl px-3 py-2.5 active:bg-surface"
                >
                  <Typography type="body" className="text-[20px]">
                    {country.flag}
                  </Typography>
                  <Typography
                    type="body-sm"
                    weight={selected ? "semibold" : "normal"}
                    className="min-w-0 flex-1 text-foreground"
                    numberOfLines={1}
                  >
                    {country.name}
                  </Typography>
                  <Typography
                    type="body-sm"
                    weight="semibold"
                    className="text-muted"
                  >
                    +{country.dialCode}
                  </Typography>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="items-center px-4 py-8">
                <Typography type="body-sm" className="text-muted">
                  No countries found
                </Typography>
              </View>
            }
          />
        </View>
      </BottomSheet.Content>
    </SheetShell>
  );
}
