import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchReviewRequestStatus, requestReview } from '../lib/reviewRequests';
import { colors } from '../navigation/theme';
import { friendlySubmitError } from '../lib/errors';

const dinersAsked = (count: number) => `${count} diner${count === 1 ? ' has' : 's have'} asked`;

/**
 * For a restaurant with no reviewed data: lets a diner ask for its menu to
 * be researched. Requests are counted per device (reviewRequests.ts) so the
 * most-wanted restaurants can be reviewed first.
 */
export function ReviewRequestButton({ osmId, restaurantName }: { osmId: number; restaurantName: string }) {
  const [count, setCount] = useState(0);
  const [requested, setRequested] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchReviewRequestStatus(osmId)
      .then((status) => {
        if (cancelled || !status) return;
        setCount(status.count);
        setRequested(status.requestedByMe);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [osmId]);

  async function handlePress() {
    setSending(true);
    setError(null);
    try {
      setCount(await requestReview(osmId, restaurantName));
      setRequested(true);
    } catch (err) {
      setError(friendlySubmitError(err, 'Could not send your request. Please try again.'));
    } finally {
      setSending(false);
    }
  }

  if (requested) {
    return (
      <View style={styles.container}>
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.safe} />
          <Text style={styles.doneText}>You asked for a safety review</Text>
        </View>
        <Text style={styles.caption}>
          {dinersAsked(count)}. Restaurants with the most requests get reviewed first.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        disabled={sending}
        accessibilityRole="button"
        accessibilityLabel="Request a safety review of this restaurant's menu"
      >
        {sending ? (
          <ActivityIndicator size="small" color={colors.brand} />
        ) : (
          <Ionicons name="hand-left-outline" size={15} color={colors.brand} />
        )}
        <Text style={styles.buttonText}>Request a safety review</Text>
      </TouchableOpacity>
      <Text style={styles.caption}>
        Asks for this restaurant's menu and allergens to be researched and added.
        {count > 0 ? ` ${dinersAsked(count)} so far.` : ''}
      </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 18,
  },
  buttonText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '600',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doneText: {
    color: colors.safe,
    fontSize: 13,
    fontWeight: '600',
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
