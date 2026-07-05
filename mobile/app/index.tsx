import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme";

// Entry route: sends the user to login or their role's home once the stored
// session (if any) has been restored.
export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === "PATIENT" ? "/patient" : "/caregiver"} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfacePage,
  },
});
