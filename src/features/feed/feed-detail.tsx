import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import Animated, {
 useAnimatedScrollHandler,
 useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
 Avatar,
 Button,
 Chip,
 PressableFeedback,
 Surface,
 Typography,
 useToast,
} from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { FeedDetailActions } from "@/features/feed/feed-detail-actions";
import { FeedDetailGallery } from "@/features/feed/feed-detail-gallery";
import { FeedDetailScoreBar } from "@/features/feed/feed-detail-score-bar";
import {
 getOrderedStatusBadges,
 type FeedItem,
 type FeedPlatform,
} from "@/models/feed";

const PLATFORM_CTA: Record<FeedPlatform, string> = {
 facebookMarketplace: "#1877F2",
 offerUp: "#00ab80",
 craigslist: "#5a00b5",
 kijiji: "#373373",
};

function formatPrice(price: number, symbol: string): string {
 const formatted = Math.round(price)
 .toString()
 .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
 return `${symbol}${formatted}`;
}

function formatTimeAgo(dateString: string): string {
 const diffMs = Math.max(0, Date.now() - new Date(dateString).getTime());
 const mins = Math.floor(diffMs / 60000);
 if (mins < 60) return `${mins} min`;
 const hours = Math.floor(mins / 60);
 if (hours < 24) return `${hours}h`;
 return `${Math.floor(hours / 24)}d`;
}

function galleryUrls(item: FeedItem): string[] {
 const fromMarket = item.images.marketplaceImages
 .map((img) => img.imageUrl)
 .filter(Boolean);
 if (fromMarket.length > 0) return fromMarket;
 const main =
 item.images.imageUrlHostedByUs || item.images.mainImageUrl.imageUrl;
 return main ? [main] : [];
}

interface FeedDetailProps {
 item: FeedItem;
 onBack: () => void;
 onToggleFavorite: () => void;
}

export function FeedDetail({
 item,
 onBack,
 onToggleFavorite,
}: FeedDetailProps): JSX.Element {
 const insets = useSafeAreaInsets();
 const { toast } = useToast();
 const [descExpanded, setDescExpanded] = useState(false);
 const scrollY = useSharedValue(0);
 const statusBadges = getOrderedStatusBadges(item);
 const images = galleryUrls(item);
 const description = item.description || "No description provided.";
 const longDesc = description.length > 160;

 const onScroll = useAnimatedScrollHandler({
 onScroll: (e) => {
 scrollY.value = e.contentOffset.y;
 },
 });

 const mockAction = (label: string) => {
 toast.show({
 variant: "accent",
 label,
 description: "Mock only - no API in this build.",
 duration: 2800,
 });
 };

 const handleFavorite = () => {
 onToggleFavorite();
 toast.show({
 variant: "success",
 label: item.isFavorite ? "Removed from saved" : "Saved",
 duration: 2200,
 });
 };

 return (
 <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
 <Animated.ScrollView
 className="flex-1"
 showsVerticalScrollIndicator={false}
 contentContainerStyle={{ paddingBottom: 96 }}
 onScroll={onScroll}
 scrollEventThrottle={16}
 >
 <View className="relative">
 <FeedDetailGallery images={images} scrollY={scrollY} />

 <PressableFeedback
 onPress={onBack}
 accessibilityLabel="Go back"
 className="absolute left-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/55"
 style={{ top: insets.top + 8 }}
 animation={{ scale: { value: 0.92 } }}
 >
 <Ionicons name="chevron-back" size={22} color="#fff" />
 </PressableFeedback>

 {statusBadges.length > 0 ? (
 <View
 className="absolute right-4 items-end gap-1.5"
 style={{ top: insets.top + 8, maxWidth: "58%" }}
 >
 {statusBadges.slice(0, 4).map((label) => (
 <Chip
 key={label}
 size="sm"
 variant="soft"
 color="default"
 className="bg-black/55"
 >
 <Chip.Label className="text-[11px] text-white">{label}</Chip.Label>
 </Chip>
 ))}
 </View>
 ) : null}
 </View>

 <View className="gap-3 px-4 pt-3">
 <Surface variant="secondary" className="gap-2 p-3.5">
 <View className="flex-row flex-wrap items-center gap-2">
 <Typography type="h3" weight="bold" className="text-foreground">
 {formatPrice(item.price, item.currencySymbol)}
 </Typography>
 {item.valuation?.fairPrice != null ? (
 <Typography type="body-sm" className="text-muted">
 Est. {formatPrice(item.valuation.fairPrice, item.currencySymbol)}
 </Typography>
 ) : null}
 </View>

 <Typography type="h5" className="text-foreground">
 {item.title}
 </Typography>

 {item.valuation?.calculated ? (
 <FeedDetailScoreBar
 buySignal={item.valuation.buySignal}
 valuationType={item.valuation.valuationType}
 iphoneModel={item.valuation.iphoneModel}
 storageGb={item.valuation.storageGb}
 batteryHealth={item.valuation.batteryHealth}
 compCount={item.valuation.compCount}
 />
 ) : null}

 {(item.vehicleSpecifications?.vehicleMileage ||
 item.vehicleSpecifications?.vehicleTransmission) && (
 <Typography type="body-sm" className="text-foreground">
 {item.vehicleSpecifications.vehicleMileage != null
 ? `Mileage: ${item.vehicleSpecifications.vehicleMileage.toLocaleString()} mi`
 : null}
 {item.vehicleSpecifications.vehicleMileage != null &&
 item.vehicleSpecifications.vehicleTransmission
 ? " · "
 : null}
 {item.vehicleSpecifications.vehicleTransmission
 ? `Transmission: ${item.vehicleSpecifications.vehicleTransmission}`
 : null}
 </Typography>
 )}

 {item.creationTime ? (
 <Typography type="body-xs" className="text-muted">
 Posted {formatTimeAgo(item.creationTime)} ago ·{" "}
 {new Date(item.creationTime).toLocaleString(undefined, {
 day: "numeric",
 month: "short",
 hour: "numeric",
 minute: "2-digit",
 })}
 </Typography>
 ) : null}

 <View className="flex-row items-center gap-2">
 <PlatformIcon platform={item.platform} size={18} />
 <Typography type="body-sm" className="flex-1 text-muted">
 {item.locationText}
 {item.distanceMiles != null
 ? ` · ${item.distanceMiles.toFixed(1)} mi`
 : ""}
 </Typography>
 </View>
 </Surface>

 {item.seller ? (
 <Surface variant="secondary" className="flex-row items-center gap-3 p-3">
 <Avatar size="md" alt={item.seller.name}>
 {item.seller.avatarUrl ? (
 <Avatar.Image source={{ uri: item.seller.avatarUrl }} />
 ) : null}
 <Avatar.Fallback />
 </Avatar>
 <View className="min-w-0 flex-1 gap-0.5">
 <Typography
 type="body-sm"
 weight="semibold"
 className="text-foreground"
 numberOfLines={1}
 >
 {item.seller.name}
 </Typography>
 <View className="flex-row flex-wrap items-center gap-2">
 {item.seller.ratingAverage != null ? (
 <Typography type="body-xs" className="text-muted">
 ★ {item.seller.ratingAverage.toFixed(1)}
 {item.seller.ratingCount != null
 ? ` (${item.seller.ratingCount})`
 : ""}
 </Typography>
 ) : null}
 {item.seller.isAutosDealer ? (
 <Chip size="sm" variant="soft" color="warning">
 <Chip.Label className="text-[10px]">Dealer</Chip.Label>
 </Chip>
 ) : null}
 </View>
 </View>
 <Button
 size="sm"
 variant="danger-soft"
 onPress={() => mockAction("Block seller")}
 >
 <Button.Label>Block</Button.Label>
 </Button>
 </Surface>
 ) : null}

 <Surface variant="secondary">
 <FeedDetailActions
 isFavorite={item.isFavorite}
 onSave={handleFavorite}
 onDelete={() => mockAction("Delete")}
 onShare={() => mockAction("Share")}
 />
 </Surface>

 <Surface variant="secondary" className="gap-2 p-3.5">
 <Typography type="body-sm" weight="semibold" className="text-foreground">
 Description
 </Typography>
 <Typography
 type="body-sm"
 className="text-muted"
 numberOfLines={descExpanded || !longDesc ? undefined : 5}
 >
 {description}
 </Typography>
 {longDesc ? (
 <PressableFeedback
 onPress={() => setDescExpanded((v) => !v)}
 className="self-start py-1"
 animation={{ scale: { value: 0.98 } }}
 >
 <Typography type="body-sm" weight="semibold" className="text-accent">
 {descExpanded ? "Show less" : "Show more"}
 </Typography>
 </PressableFeedback>
 ) : null}
 </Surface>
 </View>
 </Animated.ScrollView>

 <Surface
 variant="secondary"
 className="absolute inset-x-0 bottom-0 border-t border-border px-4 pt-2.5"
 style={{ paddingBottom: Math.max(insets.bottom, 10) }}
 >
 <Button
 variant="primary"
 className="w-full rounded-full"
 style={{ backgroundColor: PLATFORM_CTA[item.platform] }}
 onPress={() => mockAction("View on Marketplace")}
 >
 <Ionicons name="open-outline" size={16} color="#fff" />
 <Button.Label className="text-white">View on Marketplace</Button.Label>
 </Button>
 </Surface>
 </View>
 );
}
