import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { formatFriendlyDateTime } from "../lib/dateFormat";
import { colors, radius, space } from "../theme";

/**
 * Cross-platform due-date/time selector. iOS renders the inline datetime picker
 * when tapped; Android uses the imperative API to show a date dialog followed by
 * a time dialog (Android has no single "datetime" mode). Replaces the earlier
 * preset chips so any date/time can be chosen.
 *
 * UNVERIFIED-NEEDS-DEVICE: native picker rendering/behaviour on iOS + Android.
 */
export function DateTimeField({ value, onChange }: { value: Date; onChange: (next: Date) => void }) {
  const [iosOpen, setIosOpen] = useState(false);

  function openAndroid() {
    DateTimePickerAndroid.open({
      value,
      mode: "date",
      onChange: (_dateEvent, picked) => {
        if (!picked) return;
        DateTimePickerAndroid.open({
          value: picked,
          mode: "time",
          onChange: (_timeEvent, withTime) => {
            if (withTime) onChange(withTime);
          },
        });
      },
    });
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.trigger}
        onPress={() => (Platform.OS === "android" ? openAndroid() : setIosOpen((o) => !o))}
      >
        <Text style={styles.value}>{formatFriendlyDateTime(value.toISOString())}</Text>
        <Text style={styles.hint}>{Platform.OS === "android" || !iosOpen ? "Change" : "Done"}</Text>
      </Pressable>

      {Platform.OS === "ios" && iosOpen ? (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="inline"
          onChange={(_event, picked) => {
            if (picked) onChange(picked);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  value: { fontSize: 16, color: colors.textStrong, fontWeight: "600" },
  hint: { fontSize: 14, color: colors.textLink, fontWeight: "700" },
});
