import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../navigation/theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function Item({ children }: { children: ReactNode }) {
  return <Text style={styles.item}>• {children}</Text>;
}

/** Plain-language summary of what Safe Bites stores, where, and who sees it. */
export function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.lede}>
        Safe Bites helps you find restaurants with food that fits your restrictions. It's a guide, not medical
        advice: always confirm with the restaurant if you have an allergy.
      </Text>

      <Section title="Stays on this device only">
        <Item>Your restriction profile and severity levels</Item>
        <Item>Custom restrictions (words you avoid)</Item>
        <Item>Saved restaurants and your personal notes</Item>
        <Item>Recently viewed restaurants and recent search results</Item>
        <Item>Private keys that let you edit or delete your own submissions</Item>
      </Section>

      <Section title="Public (anyone using the app can see it)">
        <Item>Ratings and their comments</Item>
        <Item>Community menu items and feedback you submit</Item>
      </Section>

      <Section title="Sent to our database, but not shown">
        <Item>
          An anonymous account for this device: no name or email. It stops one person counting as many (one rating per
          restaurant, one report per entry).
        </Item>
        <Item>Your review requests, counted per device</Item>
        <Item>A one-way scrambled version of your network address, kept for a day, to limit spam</Item>
      </Section>

      <Section title="Sent to other services">
        <Item>
          The zip code or area you search is sent to OpenStreetMap's free map services (Nominatim and Overpass) to find
          restaurants. They receive your network address as part of any web request.
        </Item>
        <Item>Directions open in Google Maps, and Call opens your phone app.</Item>
      </Section>

      <Section title="Where the allergen data comes from">
        <Item>Chain allergen guides published by the chains themselves</Item>
        <Item>Restaurants' published menus, researched and tagged conservatively by Safe Bites</Item>
        <Item>Other diners (always labeled unverified, and never used for the Safe/Unsafe verdict)</Item>
        <Text style={styles.note}>
          Nothing is confirmed with kitchens unless a restaurant is marked "Confirmed by restaurant".
        </Text>
      </Section>

      <Section title="Removing your data">
        <Item>Delete your own submissions from the restaurant page where you added them.</Item>
        <Item>Clearing the app's data (or your browser's site data) removes everything stored on this device.</Item>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40, gap: 18 },
  lede: { fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  section: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 },
  heading: { fontSize: 15, fontWeight: '700', color: colors.brand, marginBottom: 2 },
  item: { fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  note: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 },
});
