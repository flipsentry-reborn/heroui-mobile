import { Redirect, type Href } from "expo-router";

export default function OnboardingIndex(): React.JSX.Element {
  return <Redirect href={"/(onboarding)/what" as Href} />;
}
