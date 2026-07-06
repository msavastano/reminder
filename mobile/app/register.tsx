import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { ApiError } from "../src/lib/apiClient";
import type { Role } from "../src/lib/types";
import { colors, radius, space } from "../src/theme";

// Ported from frontend/src/pages/RegisterPage.tsx.
export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password) {
      setError("Fill in your name, email, and a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim(), role);
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join Reminder</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoComplete="name"
                textContentType="name"
                placeholder="Jordan Rivera"
                placeholderTextColor={colors.textSubtle}
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@example.com"
                placeholderTextColor={colors.textSubtle}
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textSubtle}
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>I am a…</Text>
              <View style={styles.roleToggle}>
                {(["PATIENT", "CAREGIVER"] as const).map((r) => {
                  const active = role === r;
                  return (
                    <Pressable
                      key={r}
                      style={[styles.roleOption, active && styles.roleOptionActive]}
                      onPress={() => setRole(r)}
                      disabled={submitting}
                    >
                      <Text style={[styles.roleText, active && styles.roleTextActive]}>
                        {r === "PATIENT" ? "Patient" : "Caregiver"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.button, (pressed || submitting) && styles.buttonPressed]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textOnBrand} />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/login" replace asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfacePage },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: space[5] },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[6],
    gap: space[4],
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.textStrong },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: -space[2] },
  field: { gap: space[2] },
  label: { fontSize: 14, fontWeight: "600", color: colors.textBody },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontSize: 16,
    color: colors.textStrong,
  },
  roleToggle: { flexDirection: "row", gap: space[2] },
  roleOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
  },
  roleOptionActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  roleText: { fontSize: 15, fontWeight: "600", color: colors.textBody },
  roleTextActive: { color: colors.textOnBrand },
  error: { color: colors.danger, fontSize: 14 },
  button: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: space[4],
    alignItems: "center",
    marginTop: space[2],
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: colors.textOnBrand, fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.textLink, fontSize: 14, fontWeight: "700" },
});
