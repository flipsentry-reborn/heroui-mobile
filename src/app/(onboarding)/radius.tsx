import { Redirect, type Href } from "expo-router";

/** Legacy route — platforms + miles live on coverage. */
export default function RadiusRedirect() {
  return <Redirect href={"/(onboarding)/coverage" as Href} />;
}
