import { Redirect, type Href } from "expo-router";

export default function CriteriaRedirect() {
  return <Redirect href={"/(onboarding)/what" as Href} />;
}
