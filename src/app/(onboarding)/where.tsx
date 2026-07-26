import { Redirect, type Href } from "expo-router";

export default function WhereRedirect() {
  return <Redirect href={"/(onboarding)/what" as Href} />;
}
