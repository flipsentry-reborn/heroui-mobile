import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Chip, ListGroup, Separator, Surface, Typography } from "heroui-native";

import { getSettings } from "@/mocks/services/settings";
import type { MockUserProfile } from "@/mocks/data/settings";

function ProfileRow({
  label,
  value,
  badge,
  isLast,
}: {
  label: string;
  value: string;
  badge?: string;
  isLast?: boolean;
}): JSX.Element {
  return (
    <>
      <ListGroup.Item>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{label}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription>{value || "Not provided"}</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
        {badge ? (
          <ListGroup.ItemSuffix>
            <Chip size="sm" variant="soft" color={badge === "Verified" ? "success" : "warning"}>
              <Chip.Label className="text-[10px]">{badge}</Chip.Label>
            </Chip>
          </ListGroup.ItemSuffix>
        ) : (
          <ListGroup.ItemSuffix>
            <View />
          </ListGroup.ItemSuffix>
        )}
      </ListGroup.Item>
      {!isLast ? <Separator className="mx-4" /> : null}
    </>
  );
}

export default function ProfileScreen(): JSX.Element {
  const [profile, setProfile] = useState<MockUserProfile | null>(null);

  useEffect(() => {
    void getSettings().then((s) => setProfile(s.profile));
  }, []);

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Typography type="body-sm" className="text-muted">
          Loading profile...
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3 p-4 pb-10">
      <Surface variant="secondary" className="overflow-hidden rounded-2xl">
        <Typography type="body-xs" weight="semibold" className="px-4 pb-1 pt-3 uppercase text-muted">
          Personal
        </Typography>
        <ListGroup variant="transparent">
          <ProfileRow label="First Name" value={profile.firstName} />
          <ProfileRow label="Last Name" value={profile.lastName} isLast />
        </ListGroup>
      </Surface>

      <Surface variant="secondary" className="overflow-hidden rounded-2xl">
        <Typography type="body-xs" weight="semibold" className="px-4 pb-1 pt-3 uppercase text-muted">
          Contact
        </Typography>
        <ListGroup variant="transparent">
          <ProfileRow
            label="Email"
            value={profile.email}
            badge={profile.emailConfirmed ? "Verified" : "Unverified"}
          />
          <ProfileRow
            label="Phone Number"
            value={profile.phoneNumber ?? "Not provided"}
            badge={
              profile.phoneNumber
                ? profile.numberConfirmed
                  ? "Verified"
                  : "Unverified"
                : undefined
            }
            isLast
          />
        </ListGroup>
      </Surface>

      <Surface variant="secondary" className="overflow-hidden rounded-2xl">
        <Typography type="body-xs" weight="semibold" className="px-4 pb-1 pt-3 uppercase text-muted">
          Account
        </Typography>
        <ListGroup variant="transparent">
          <ProfileRow label="Account Status" value="Active" />
          <ProfileRow
            label="Member Since"
            value={new Date().toLocaleDateString()}
            isLast
          />
        </ListGroup>
      </Surface>
    </ScrollView>
  );
}
