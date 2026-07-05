import { Redirect } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { MessagesSection } from "../src/components/MessagesSection";
import { useAuth } from "../src/context/AuthContext";
import { colors, space } from "../src/theme";

// Patient's message inbox: read messages from caregivers, tap unread to mark read.
export default function MessagesScreen() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <MessagesSection patientId={user.id} currentUserId={user.id} mode="patient" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfacePage },
  content: { padding: space[5] },
});
