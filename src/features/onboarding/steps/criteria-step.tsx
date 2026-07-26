import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, type Href } from "expo-router";
import {
  Input,
  Label,
  Spinner,
  TextField,
  Typography,
  useThemeColor,
} from "heroui-native";

import agent from "@/api/agent";
import { BrandButton } from "@/components/ui/brand-button";
import {
  AUTH_CONTROL_BACKGROUND,
  AUTH_PLACEHOLDER_COLOR,
} from "@/features/auth/auth-theme";
import { OnboardingOptionCard } from "@/features/onboarding/onboarding-option-card";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import {
  ONBOARDING_BORDER_IDLE,
  ONBOARDING_SURFACE,
} from "@/features/onboarding/onboarding-theme";
import type { CarMake } from "@/models/car-make";
import type { IphoneModel } from "@/models/iphone";
import { Fonts } from "@/lib/fonts";
import { toUserErrorMessage } from "@/lib/user-error-message";
import { useStore } from "@/store/store";

export const CriteriaStep = observer(function CriteriaStep(): JSX.Element {
  const { onboardingStore } = useStore();
  const [accentFg, muted, danger, foreground] = useThemeColor([
    "accent-foreground",
    "muted",
    "danger",
    "foreground",
  ]);
  const searchType = onboardingStore.draft.searchType;
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [iphones, setIphones] = useState<IphoneModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchType == null) {
      router.replace("/(onboarding)/what" as Href);
      return;
    }
    if (!onboardingStore.canContinueWhere) {
      router.replace("/(onboarding)/where" as Href);
      return;
    }
    if (!onboardingStore.canContinueCoverage) {
      router.replace("/(onboarding)/coverage" as Href);
    }
  }, [
    searchType,
    onboardingStore.canContinueWhere,
    onboardingStore.canContinueCoverage,
  ]);

  useEffect(() => {
    if (searchType !== "car" && searchType !== "iphone") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const load =
      searchType === "car"
        ? agent.CarMakes.list().then((data) => {
            if (!cancelled) setMakes(data.slice(0, 40));
          })
        : agent.IphoneModels.listGrouped().then((catalog) => {
            if (cancelled) return;
            const flat = (catalog.groups ?? []).flatMap((g) => g.models);
            setIphones(flat.slice(0, 40));
          });
    void load
      .catch((e) => {
        if (!cancelled) setError(toUserErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchType]);

  const onSkip = async () => {
    await onboardingStore.skip();
    router.replace("/feed" as Href);
  };

  const onFinish = async () => {
    const ok = await onboardingStore.finish();
    if (ok) router.replace("/feed" as Href);
  };

  const title =
    searchType === "car"
      ? "Any make or pick a few?"
      : searchType === "iphone"
        ? "Which iPhone models?"
        : "What keyword should we watch?";

  const subtitle =
    searchType === "car"
      ? "Any make covers everything, or check one or more brands."
      : searchType === "iphone"
        ? "Select one or more models — checkbox style."
        : "You can tighten filters from Home anytime.";

  return (
    <OnboardingShell
      step={4}
      title={title}
      subtitle={subtitle}
      onBack={() => router.back()}
      onSkip={() => void onSkip()}
      footer={
        <>
          <BrandButton
            className="min-h-12 w-full rounded-full"
            isDisabled={
              !onboardingStore.canContinueCriteria || onboardingStore.submitting
            }
            onPress={() => void onFinish()}
          >
            {onboardingStore.submitting ? (
              <Spinner size="sm" color={accentFg} />
            ) : null}
            <BrandButton.Label>Create my searches</BrandButton.Label>
          </BrandButton>
          {onboardingStore.lastError ? (
            <Text
              style={{
                fontFamily: Fonts.headingRegular,
                fontSize: 14,
                lineHeight: 20,
                color: danger,
                textAlign: "center",
              }}
            >
              {onboardingStore.lastError}
            </Text>
          ) : null}
        </>
      }
    >
      {searchType === "custom" ? (
        <TextField>
          <Label className="text-muted">Keyword</Label>
          <Input
            value={onboardingStore.draft.customQuery}
            onChangeText={(text: string) =>
              onboardingStore.setCustomQuery(text)
            }
            placeholder="e.g. MacBook Pro, sofa, scooter"
            placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
            autoCorrect={false}
            className="h-12 rounded-2xl border-transparent text-foreground shadow-none"
            style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
          />
        </TextField>
      ) : null}

      {searchType === "car" ? (
        <View className="gap-2">
          <OnboardingOptionCard
            selected={onboardingStore.draft.carAnyMake}
            onPress={() => onboardingStore.setCarAnyMake()}
            className="flex-row items-center gap-3 px-4 py-3.5"
          >
            <Ionicons
              name={
                onboardingStore.draft.carAnyMake ? "checkbox" : "square-outline"
              }
              size={22}
              color={onboardingStore.draft.carAnyMake ? foreground : muted}
            />
            <Typography
              type="body"
              weight="semibold"
              className="text-foreground"
            >
              Any make
            </Typography>
          </OnboardingOptionCard>
          {loading ? <ActivityIndicator color={foreground} /> : null}
          <ScrollView
            className="max-h-72"
            nestedScrollEnabled
            style={{
              backgroundColor: ONBOARDING_SURFACE,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: ONBOARDING_BORDER_IDLE,
            }}
            contentContainerClassName="px-2 py-1"
          >
            {makes.map((make) => {
              const selected =
                !onboardingStore.draft.carAnyMake &&
                onboardingStore.draft.carMakes.includes(make.make);
              return (
                <Pressable
                  key={make.make}
                  onPress={() => onboardingStore.toggleCarMake(make.make)}
                  className="flex-row items-center gap-3 px-2 py-3"
                >
                  <Ionicons
                    name={selected ? "checkbox" : "square-outline"}
                    size={22}
                    color={selected ? foreground : muted}
                  />
                  <Typography type="body" className="text-foreground">
                    {make.make}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {searchType === "iphone" ? (
        <View className="gap-2">
          {loading ? <ActivityIndicator color={foreground} /> : null}
          <ScrollView
            className="max-h-80"
            nestedScrollEnabled
            style={{
              backgroundColor: ONBOARDING_SURFACE,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: ONBOARDING_BORDER_IDLE,
            }}
            contentContainerClassName="px-2 py-1"
          >
            {iphones.map((model) => {
              const selected = onboardingStore.draft.iphoneModelIds.includes(
                model.model,
              );
              return (
                <Pressable
                  key={model.model}
                  onPress={() =>
                    onboardingStore.toggleIphoneModelId(model.model)
                  }
                  className="flex-row items-center gap-3 px-2 py-3"
                >
                  <Ionicons
                    name={selected ? "checkbox" : "square-outline"}
                    size={22}
                    color={selected ? foreground : muted}
                  />
                  <Typography type="body" className="text-foreground">
                    {model.displayName ?? model.model}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {error ? (
        <Typography type="body-sm" className="text-center text-danger">
          {error}
        </Typography>
      ) : null}
    </OnboardingShell>
  );
});
