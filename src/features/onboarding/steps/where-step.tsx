import { Ionicons } from "@expo/vector-icons";
import { observer } from "mobx-react-lite";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router, type Href } from "expo-router";
import {
  Input,
  Label,
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
import type { LocationResult } from "@/mocks/data/locations";
import { toUserErrorMessage } from "@/lib/user-error-message";
import { useStore } from "@/store/store";

export const WhereStep = observer(function WhereStep(): JSX.Element {
  const { onboardingStore } = useStore();
  const foreground = useThemeColor("foreground");
  const [query, setQuery] = useState(
    onboardingStore.draft.location?.displayName ?? "",
  );
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (onboardingStore.draft.searchType == null) {
      router.replace("/(onboarding)/what" as Href);
    }
  }, [onboardingStore.draft.searchType]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void agent.Locations.search(term)
        .then((list) => {
          if (!cancelled) setResults(list);
        })
        .catch((e) => {
          if (!cancelled) setError(toUserErrorMessage(e));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const onSkip = async () => {
    await onboardingStore.skip();
    router.replace("/feed" as Href);
  };

  const onPick = async (place: LocationResult) => {
    setError("");
    setResolving(true);
    try {
      const resolved = await agent.Locations.resolve(place);
      onboardingStore.setLocation(resolved);
      setQuery(resolved.displayName || resolved.name);
      setResults([]);
    } catch (e) {
      setError(toUserErrorMessage(e));
    } finally {
      setResolving(false);
    }
  };

  const selected = onboardingStore.draft.location;

  return (
    <OnboardingShell
      step={2}
      title="Where should we search?"
      subtitle="Pick a city or region. You can refine this later."
      onBack={() => router.back()}
      onSkip={() => void onSkip()}
      footer={
        <BrandButton
          className="min-h-12 w-full rounded-full"
          isDisabled={!onboardingStore.canContinueWhere || resolving}
          onPress={() => router.push("/(onboarding)/coverage" as Href)}
        >
          <BrandButton.Label>Continue</BrandButton.Label>
        </BrandButton>
      }
    >
      <TextField>
        <Label className="text-muted">Location</Label>
        <Input
          value={query}
          onChangeText={(text: string) => {
            setQuery(text);
            onboardingStore.setLocation(null);
          }}
          placeholder="e.g. New York, Miami, Toronto"
          placeholderTextColor={AUTH_PLACEHOLDER_COLOR}
          autoCorrect={false}
          className="h-12 rounded-2xl border-transparent text-foreground shadow-none"
          style={{ backgroundColor: AUTH_CONTROL_BACKGROUND }}
        />
      </TextField>

      {loading || resolving ? (
        <View className="items-center py-3">
          <ActivityIndicator color={foreground} />
        </View>
      ) : null}

      {selected && onboardingStore.canContinueWhere ? (
        <Animated.View entering={FadeInDown.duration(280)}>
          <OnboardingOptionCard
            selected
            className="flex-row items-center gap-2 px-3 py-3"
          >
            <Ionicons name="location" size={18} color={foreground} />
            <Typography type="body-sm" className="flex-1 text-foreground">
              {selected.displayName || selected.name}
            </Typography>
          </OnboardingOptionCard>
        </Animated.View>
      ) : null}

      <View className="gap-2">
        {results.map((place, index) => (
          <Animated.View
            key={place.id || place.placeId || place.displayName}
            entering={FadeInDown.delay(index * 40).duration(280)}
          >
            <OnboardingOptionCard
              onPress={() => void onPick(place)}
              className="px-3.5 py-3"
            >
              <Typography type="body" className="text-foreground">
                {place.displayName || place.name}
              </Typography>
              {place.secondaryText ? (
                <Typography type="body-sm" className="mt-0.5 text-muted">
                  {place.secondaryText}
                </Typography>
              ) : null}
            </OnboardingOptionCard>
          </Animated.View>
        ))}
      </View>

      {error ? (
        <Typography type="body-sm" className="text-center text-danger">
          {error}
        </Typography>
      ) : null}
    </OnboardingShell>
  );
});
