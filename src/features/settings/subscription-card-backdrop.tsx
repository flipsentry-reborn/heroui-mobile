import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { View } from "react-native";

import {
  SubscriptionParticleField,
  type ParticleDensity,
} from "@/features/settings/subscription-particles";
import {
  PLAN_GLOW_GRADIENT,
  type PlanPalette,
} from "@/features/settings/subscription-theme";

interface SubscriptionCardBackdropProps {
  palette: PlanPalette;
  particleDensity?: ParticleDensity;
  showParticles?: boolean;
}

/**
 * Shared visual surface for plan-aware cards.
 * Keep gradient, glow, highlight, and particle changes centralized here.
 */
export function SubscriptionCardBackdrop({
  palette,
  particleDensity = "standard",
  showParticles = true,
}: SubscriptionCardBackdropProps): JSX.Element {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <LinearGradient
        colors={palette.gradient}
        locations={[0, 0.34, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={[palette.glow, "transparent"]}
        start={PLAN_GLOW_GRADIENT.start}
        end={PLAN_GLOW_GRADIENT.end}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={["transparent", palette.ambientGlow]}
        locations={[0.28, 1]}
        start={{ x: 0.92, y: 0.05 }}
        end={{ x: 0.05, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.1)", "transparent"]}
        locations={[0, 0.42]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.7, y: 0.55 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
      {showParticles ? (
        <SubscriptionParticleField
          density={particleDensity}
          accentColor={palette.iconFrom}
        />
      ) : null}
    </View>
  );
}
