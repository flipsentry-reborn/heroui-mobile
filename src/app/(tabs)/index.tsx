import { Redirect } from "expo-router";
import type { JSX } from "react";

/** App entry (`/`) opens Feed; Home stays available as its own tab. */
export default function TabsIndex(): JSX.Element {
  return <Redirect href="/feed" />;
}
