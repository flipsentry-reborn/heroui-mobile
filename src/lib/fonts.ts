/**
 * Britti Sans (HeroUI Pro `heroSans`) - app-wide display/UI font.
 *
 * Where to configure for the whole app:
 * 1. Load files: `src/app/_layout.tsx` (`useFonts` + `assets/fonts/BrittiSans-*.ttf`)
 * 2. Map weights: `src/global.css` `@theme` (`--font-normal`, `--font-bold`, …)
 *
 * After (2), HeroUI `Typography` / `Button.Label` with `font-bold` etc. use Britti.
 * Use `Fonts.*` only when you need an explicit `style={{ fontFamily }}` (raw Text).
 */
export const Fonts = {
  regular: "BrittiSans-Regular",
  medium: "BrittiSans-Medium",
  semibold: "BrittiSans-SemiBold",
  bold: "BrittiSans-Bold",
  /** Aliases used by subscription cards */
  heading: "BrittiSans-Bold",
  headingSemi: "BrittiSans-SemiBold",
  headingMedium: "BrittiSans-Medium",
  headingRegular: "BrittiSans-Regular",
} as const;
