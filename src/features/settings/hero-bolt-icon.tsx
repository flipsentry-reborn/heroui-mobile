import type { JSX } from "react";
import { useId } from "react";
import { View } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";

/** HeroUI Pro hexagon + bolt badge. */
export function HeroBoltIcon({
  from,
  to,
  size = 24,
  boltFill = "#ffffff",
  stroke,
}: {
  from: string;
  to: string;
  size?: number;
  boltFill?: string;
  /** Optional hexagon outline (e.g. white badge on white surface). */
  stroke?: string;
}): JSX.Element {
  const uid = useId().replace(/:/g, "");
  const gradId = `hero-bolt-${uid}`;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          left: 1,
          top: 1,
          width: size - 2,
          height: size - 2,
        }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 19.0526 20.7624"
          fill="none"
        >
          <Defs>
            <SvgLinearGradient
              id={gradId}
              x1="9.52628"
              y1="-0.618802"
              x2="9.52628"
              y2="21.3812"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </SvgLinearGradient>
          </Defs>
          <Path
            d="M7.52628 0.535898C8.76388 -0.178633 10.2887 -0.178633 11.5263 0.535898L17.0526 3.7265C18.2902 4.44103 19.0526 5.76154 19.0526 7.1906V13.5718C19.0526 15.0009 18.2902 16.3214 17.0526 17.0359L11.5263 20.2265C10.2887 20.941 8.76388 20.941 7.52628 20.2265L2 17.0359C0.762395 16.3214 0 15.0009 0 13.5718V7.1906C0 5.76154 0.762396 4.44103 2 3.7265L7.52628 0.535898Z"
            fill={`url(#${gradId})`}
            stroke={stroke}
            strokeWidth={stroke ? 1.1 : 0}
          />
        </Svg>
      </View>
      <View
        style={{
          position: "absolute",
          left: size * 0.25,
          right: size * 0.25,
          top: size * 0.25,
          bottom: size * 0.22,
        }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 5.62624 9.00012"
          fill="none"
        >
          <Path
            d="M3.38916 3.09412V0.35512C3.40266 0.28762 3.37716 0.12712 3.16716 0.0286197C2.98416 -0.0573803 2.78466 0.0701196 2.72466 0.15212C1.81216 1.61062 0.108164 4.67762 0.041664 4.83212C-0.042836 5.02662 0.0146642 5.14762 0.0946642 5.23712C0.154164 5.30412 0.296164 5.34412 0.372164 5.34412H2.22466L1.82966 8.69412C1.83466 8.77162 1.89966 8.93912 2.11166 8.99012C2.32416 9.04062 2.47016 8.88762 2.51666 8.80512L5.54516 3.68012C5.58916 3.61262 5.68016 3.43312 5.58316 3.27512C5.54615 3.21659 5.49422 3.16898 5.4327 3.13717C5.37119 3.10536 5.30232 3.0905 5.23316 3.09412H3.38916Z"
            fill={boltFill}
          />
        </Svg>
      </View>
    </View>
  );
}
