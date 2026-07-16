# App fonts (Britti Sans)

Same face as HeroUI Pro pricing headings (`heroSans` / Britti Sans).  
Overall design preferences: **`DESIGN.md`**.

If fonts silently fall back to system type, TTF name tables may be broken. Rebuild with:

```bash
python scripts/rebuild-britti-fonts.py
```

(Requires downloading the variable source into `assets/fonts/_britti_var.woff2` first; see script header.)

## Where to write / change fonts

| Step | File | What |
|------|------|------|
| 1. Font files | `assets/fonts/BrittiSans-*.ttf` | Add or replace `.ttf` files |
| 2. Load at boot | `src/app/_layout.tsx` | `useFonts({ "BrittiSans-Bold": require(...) })` |
| 3. App-wide mapping | `src/global.css` → `@theme` | `--font-normal`, `--font-medium`, `--font-semibold`, `--font-bold`, `--font-sans` |
| 4. Optional helpers | `src/lib/fonts.ts` | `Fonts.bold` etc. for `style={{ fontFamily }}` |

Restart Metro after changing `global.css` (`npx expo start -c`).

## How components pick it up

HeroUI Native uses Uniwind classes like `font-normal` / `font-semibold` / `font-bold`.

Those map to the `@theme` variables in `global.css`, so:

- `Typography`, `Button.Label`, settings rows, etc. use Britti automatically
- No need to set `fontFamily` on every button unless using raw `Text`

## Using in custom `Text`

```tsx
import { Text } from "react-native";
import { Fonts } from "@/lib/fonts";

<Text style={{ fontFamily: Fonts.bold }}>Become a Hero.</Text>
// or
<Text className="font-bold text-foreground">Become a Hero.</Text>
```

## Swapping to another family later

1. Drop new `.ttf` files in `assets/fonts/`
2. Register them in `_layout.tsx` `useFonts`
3. Update the `--font-*` values in `global.css` to the new names
4. Update `src/lib/fonts.ts` if you use `Fonts.*`
