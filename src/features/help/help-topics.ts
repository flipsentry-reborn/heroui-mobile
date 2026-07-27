import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IonName = ComponentProps<typeof Ionicons>["name"];

export type HelpTopicId =
  | "searches"
  | "feed-alerts"
  | "plans"
  | "account";

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
}

export interface HelpTopic {
  id: HelpTopicId;
  title: string;
  description: string;
  icon: IonName;
  faqs: HelpFaq[];
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "searches",
    title: "Searches & location",
    description: "Radius, models, and how groups run",
    icon: "search-outline",
    faqs: [
      {
        id: "how-search",
        question: "How do Marketplace searches work?",
        answer:
          "Each search watches Facebook Marketplace for listings that match your models, price, and radius. New matches show up in Feed as soon as we find them.",
      },
      {
        id: "radius",
        question: "Why am I seeing listings too far away?",
        answer:
          "Open the search on Home, edit Location, and tighten the radius. Distance uses your preferred unit from Settings (miles or kilometers).",
      },
      {
        id: "slots",
        question: "I can’t add another search",
        answer:
          "Your plan limits how many Instant and scheduled searches you can run at once. Pause or delete an existing search, or upgrade from Settings → Plan.",
      },
      {
        id: "models",
        question: "Wrong iPhone models in results",
        answer:
          "Edit the search criteria and confirm the model list. Custom queries and platform filters also change what we include.",
      },
    ],
  },
  {
    id: "feed-alerts",
    title: "Feed & notifications",
    description: "Alerts, sold listings, and quiet hours",
    icon: "notifications-outline",
    faqs: [
      {
        id: "noisy",
        question: "Alerts feel too noisy",
        answer:
          "Tighten search criteria, raise your margin target, or use notification quiet hours in Settings → Notification. You can also hide dealer and salvage-style listings in preferences.",
      },
      {
        id: "missing",
        question: "I’m missing listings",
        answer:
          "Check that the search is Active (not paused), radius isn’t too tight, and filters aren’t hiding matches. Pull to refresh Feed, and confirm push notifications are allowed for FlipSentry.",
      },
      {
        id: "sold",
        question: "Why do sold or junk listings appear?",
        answer:
          "Marketplace changes fast. We flag sold status when we can, but some posts linger. Use Hide listings and block sellers from the listing detail when needed.",
      },
      {
        id: "push",
        question: "I’m not getting push notifications",
        answer:
          "Open Settings → Notification and confirm alerts are on. Also check iOS/Android system settings for FlipSentry notification permission.",
      },
    ],
  },
  {
    id: "plans",
    title: "Plans & credits",
    description: "Slots, billing, and upgrades",
    icon: "diamond-outline",
    faqs: [
      {
        id: "which-plan",
        question: "What’s the difference between plans?",
        answer:
          "Higher plans unlock more Instant searches, longer coverage windows, and more scheduled slots. Open Settings → Plan to compare what’s available on your account.",
      },
      {
        id: "credits",
        question: "Where do credits / slots go?",
        answer:
          "Each active search uses a slot for its type (Instant vs scheduled). Pausing frees the slot so you can start another search.",
      },
      {
        id: "billing",
        question: "Billing or restore purchase",
        answer:
          "Subscriptions are managed through the App Store or Google Play. If a purchase didn’t sync, reopen Settings → Plan or contact support with your account email.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & login",
    description: "Profile, verify, and delete account",
    icon: "person-outline",
    faqs: [
      {
        id: "verify",
        question: "Phone verification issues",
        answer:
          "Use the code from SMS on the verify screen. If it expired, request a new code. Still stuck? Email support with the number you’re verifying.",
      },
      {
        id: "profile",
        question: "Update profile or password",
        answer:
          "Go to Settings → Profile to edit account details. Use Forgot password on the login screen if you can’t sign in.",
      },
      {
        id: "delete",
        question: "Delete my account",
        answer:
          "Settings → Danger zone → Delete account. This permanently removes your FlipSentry account and searches.",
      },
    ],
  },
];

export function getHelpTopic(id: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.id === id);
}
