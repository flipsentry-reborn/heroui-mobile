import { Redirect, type Href } from "expo-router";

export default function RadiusRedirect() {
  return <Redirect href={"/(onboarding)/what" as Href} />;
}
