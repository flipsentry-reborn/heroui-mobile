import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { View } from "react-native";
import {
  ListGroup,
  PressableFeedback,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";

const CRITERIA_ROWS: {
  key: string;
  title: string;
  value: string;
  required?: boolean;
  showSwap?: boolean;
  showChevron?: boolean;
}[] = [
  {
    key: "search",
    title: "Search",
    value: "Empty",
    required: true,
    showSwap: true,
    showChevron: false,
  },
  { key: "price", title: "Price", value: "None", showChevron: true },
  { key: "keywords", title: "Keywords", value: "None", showChevron: true },
];

function CriteriaRow({
  title,
  value,
  required,
  showSwap,
  showChevron = true,
  isLast,
  onPress,
}: {
  title: string;
  value: string;
  required?: boolean;
  showSwap?: boolean;
  showChevron?: boolean;
  isLast: boolean;
  onPress?: () => void;
}): JSX.Element {
  const [muted, danger] = useThemeColor(["muted", "danger"]);

  const body = (
    <>
      <ListGroup.ItemContent>
        <View className="flex-row items-center gap-1">
          <ListGroup.ItemTitle className="text-[15px] font-normal text-foreground">
            {title}
          </ListGroup.ItemTitle>
          {showSwap ? (
            <Ionicons name="swap-vertical" size={14} color={muted} />
          ) : null}
          {required ? (
            <Typography type="body-sm" style={{ color: danger }}>
              *
            </Typography>
          ) : null}
        </View>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <View className="flex-row items-center gap-1">
          <Typography type="body-sm" className="text-muted">
            {value}
          </Typography>
          {showChevron ? (
            <Ionicons name="chevron-forward" size={16} color={muted} />
          ) : null}
        </View>
      </ListGroup.ItemSuffix>
    </>
  );

  return (
    <>
      {onPress ? (
        <PressableFeedback animation={false} onPress={onPress}>
          <PressableFeedback.Scale>
            <ListGroup.Item disabled className="py-2">
              {body}
            </ListGroup.Item>
          </PressableFeedback.Scale>
          <PressableFeedback.Highlight />
          <PressableFeedback.Ripple />
        </PressableFeedback>
      ) : (
        <ListGroup.Item disabled className="py-2">
          {body}
        </ListGroup.Item>
      )}
      {!isLast ? <Separator className="ml-4 mr-4 opacity-50" /> : null}
    </>
  );
}

export function SearchBottomSheetCriteria(): JSX.Element {
  return (
    <View className="mb-4 mt-2 gap-1.5">
      <Typography type="body-xs" className="mx-5 text-muted">
        Criteria
      </Typography>

      <ListGroup className="mx-3">
        {CRITERIA_ROWS.map((row, index) => (
          <CriteriaRow
            key={row.key}
            title={row.title}
            value={row.value}
            required={row.required}
            showSwap={row.showSwap}
            showChevron={row.showChevron}
            isLast={index === CRITERIA_ROWS.length - 1}
            onPress={() => {}}
          />
        ))}
      </ListGroup>
    </View>
  );
}
