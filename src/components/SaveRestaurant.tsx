import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  loadSaved,
  MAX_NOTE_LENGTH,
  onSavedChanged,
  saveRestaurant,
  setSavedNote,
  unsaveRestaurant,
  type SavedRestaurant,
} from '../lib/savedRestaurants';
import { colors } from '../navigation/theme';

type Entry = Omit<SavedRestaurant, 'savedAt' | 'note'>;

/** Whether this restaurant is saved on this device, kept in sync with the Saved tab. */
function useSavedEntry(osmId: number): SavedRestaurant | null | undefined {
  const [entry, setEntry] = useState<SavedRestaurant | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    const refresh = () =>
      loadSaved().then((list) => {
        if (active) setEntry(list.find((e) => e.osmId === osmId) ?? null);
      });
    refresh();
    const unsubscribe = onSavedChanged(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [osmId]);
  return entry;
}

/** Bookmark toggle for the restaurant page header. */
export function SaveButton({ restaurant }: { restaurant: Entry }) {
  const entry = useSavedEntry(restaurant.osmId);
  const saved = !!entry;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      aria-pressed={saved}
      accessibilityLabel={saved ? 'Remove from saved restaurants' : 'Save this restaurant'}
      style={styles.iconButton}
      disabled={entry === undefined}
      onPress={() => (saved ? unsaveRestaurant(restaurant.osmId) : saveRestaurant(restaurant)).catch(() => {})}
    >
      <Ionicons
        name={saved ? 'bookmark' : 'bookmark-outline'}
        size={20}
        color={saved ? colors.brand : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

/** Shown once saved: the diner's personal note, clearly separate from Safe Bites' data. */
export function SavedNote({ osmId }: { osmId: number }) {
  const entry = useSavedEntry(osmId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!entry) return null;

  if (editing) {
    return (
      <View style={styles.noteBox}>
        <Text style={styles.noteLabel}>Your note (only on this device)</Text>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="e.g. Ate here fine. Ask for no soy sauce."
          maxLength={MAX_NOTE_LENGTH}
          multiline
          autoFocus
        />
        <View style={styles.row}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.saveButton}
            onPress={() => {
              setSavedNote(osmId, draft).catch(() => {});
              setEditing(false);
            }}
          >
            <Text style={styles.saveButtonText}>Save note</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => setEditing(false)}>
            <Text style={styles.link}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.noteBox}>
      <View style={styles.row}>
        <Ionicons name="bookmark" size={13} color={colors.brand} />
        <Text style={styles.savedText}>Saved</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            setDraft(entry.note ?? '');
            setEditing(true);
          }}
        >
          <Text style={styles.link}>{entry.note ? 'Edit note' : 'Add a personal note'}</Text>
        </TouchableOpacity>
      </View>
      {entry.note && (
        <Text style={styles.noteText}>
          <Text style={styles.noteLabelInline}>Your note: </Text>
          {entry.note}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: { padding: 6, marginTop: 2 },
  noteBox: { backgroundColor: '#eef4f6', borderRadius: 10, padding: 10, marginBottom: 12, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savedText: { flex: 1, color: colors.brand, fontWeight: '700', fontSize: 13 },
  link: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  noteLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  noteLabelInline: { fontWeight: '700' },
  noteText: { color: colors.brandDark, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
    color: colors.textPrimary,
  },
  saveButton: { backgroundColor: colors.brand, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
