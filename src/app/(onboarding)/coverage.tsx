import { Redirect, type Href } from "expo-router";

export default function CoverageRedirect() {
  return <Redirect href={"/(onboarding)/what" as Href} />;
}
