import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { deviceId } from '../lib/deviceId';
import type { Database } from '../lib/database.types';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../navigation/theme';

export const MAX_RATING_COMMENT_LENGTH = 500;

/**
 * RatingsSection -- D4: two-axis (Accuracy Rating + Accommodation Rating)
 * feedback UI, per epic SB-5 / vision.md domain vocabulary.
 *
 * Reads and writes the `ratings` table directly with the anon key (no auth,
 * per ADR-0002) -- see supabase/migrations/0001_initial_schema.sql.
 * Ratings are keyed by `osm_id` (NOT `restaurant_id`); any live-discovered
 * restaurant can be rated even without seeded safety data.
 */
export interface RatingsSectionProps {
  osmId: number;
  restaurantName: string;
  onSubmitted?: () => void;
}

type RatingRow = Database['public']['Tables']['ratings']['Row'];

const STAR_VALUES = [1, 2, 3, 4, 5];

function StarPicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.pickerBlock}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.starRow}>
        {STAR_VALUES.map((star) => (
          <TouchableOpacity
            key={star}
            disabled={disabled}
            onPress={() => onChange(star)}
            accessibilityRole="button"
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            style={styles.starButton}
          >
            <Text style={[styles.starText, value !== null && star <= value && styles.starTextFilled]}>
              {value !== null && star <= value ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function formatAverage(rows: RatingRow[], key: 'accuracy_rating' | 'accommodation_rating'): string {
  if (rows.length === 0) return '--';
  const sum = rows.reduce((acc, row) => acc + row[key], 0);
  return (sum / rows.length).toFixed(1);
}

/** This device's rating for the restaurant (0011 `my_rating`), or null. */
interface MyRating {
  accuracy: number;
  accommodation: number;
  comment: string | null;
  ratedAt: string;
}

function starString(value: number): string {
  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

function formatRatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function RatingsSection({ osmId, restaurantName, onSubmitted }: RatingsSectionProps) {
  const [accuracyRating, setAccuracyRating] = useState<number | null>(null);
  const [accommodationRating, setAccommodationRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Each device has one rating per restaurant (0010). When it exists, the
  // section shows it with "Edit your rating" instead of a blank form.
  const [myRating, setMyRating] = useState<MyRating | null>(null);
  const [editing, setEditing] = useState(false);
  // No rating yet: the form stays behind a "Rate this restaurant" button.
  const [formOpen, setFormOpen] = useState(false);
  const [justSaved, setJustSaved] = useState<'new' | 'updated' | null>(null);

  const [existingRatings, setExistingRatings] = useState<RatingRow[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [existingError, setExistingError] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    setLoadingExisting(true);
    setExistingError(null);
    const [{ data, error: fetchError }, mine] = await Promise.all([
      supabase
        .from('ratings')
        .select('id, osm_id, restaurant_name, accuracy_rating, accommodation_rating, comment, created_at')
        .eq('osm_id', osmId)
        .order('created_at', { ascending: false }),
      deviceId().then((id) => supabase.rpc('my_rating', { p_osm_id: osmId, p_device_id: id })),
    ]);

    if (fetchError) {
      setExistingError('Could not load existing ratings.');
    } else {
      setExistingRatings(data ?? []);
    }
    // A lookup failure (e.g. before migration 0011) just means "no rating shown".
    const row = !mine.error ? mine.data?.[0] : undefined;
    setMyRating(
      row
        ? {
            accuracy: row.accuracy_rating,
            accommodation: row.accommodation_rating,
            comment: row.comment,
            ratedAt: row.updated_at ?? row.created_at,
          }
        : null
    );
    setLoadingExisting(false);
  }, [osmId]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const canSubmit = accuracyRating !== null && accommodationRating !== null && !submitting;

  const handleSubmit = async () => {
    if (accuracyRating === null || accommodationRating === null) {
      setValidationMessage('Please pick both an accuracy rating and an accommodation rating before submitting.');
      return;
    }
    setValidationMessage(null);
    setError(null);
    setSubmitting(true);

    // One rating per device per restaurant (0010): rating again replaces it.
    const { data: existed, error: insertError } = await supabase.rpc('submit_rating', {
      p_osm_id: osmId,
      p_restaurant_name: restaurantName,
      p_accuracy_rating: accuracyRating,
      p_accommodation_rating: accommodationRating,
      p_comment: comment.trim(),
      p_device_id: await deviceId(),
    });

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong submitting your rating. Please try again.');
      return;
    }

    setEditing(false);
    setFormOpen(false);
    setJustSaved(existed === true ? 'updated' : 'new');
    loadExisting();
    onSubmitted?.();
  };

  // Opens the form filled with this device's current rating, ready to change.
  const startEditing = () => {
    setAccuracyRating(myRating?.accuracy ?? null);
    setAccommodationRating(myRating?.accommodation ?? null);
    setComment(myRating?.comment ?? '');
    setError(null);
    setValidationMessage(null);
    setJustSaved(null);
    setEditing(true);
  };

  const showForm = !loadingExisting && (editing || (myRating === null && formOpen));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ratings</Text>

      <View style={styles.summaryBlock}>
        {loadingExisting ? (
          <ActivityIndicator size="small" />
        ) : existingError ? (
          <Text style={styles.errorText}>{existingError}</Text>
        ) : existingRatings.length === 0 ? (
          <Text style={styles.summaryText}>No ratings yet — be the first to rate this restaurant.</Text>
        ) : (
          <>
            <Text style={styles.summaryText}>
              {existingRatings.length} rating{existingRatings.length === 1 ? '' : 's'} · Avg accuracy{' '}
              {formatAverage(existingRatings, 'accuracy_rating')} · Avg accommodation{' '}
              {formatAverage(existingRatings, 'accommodation_rating')}
            </Text>
            {existingRatings
              .filter((row) => !!row.comment)
              .slice(0, 3)
              .map((row) => (
                <Text key={row.id} style={styles.commentPreview} numberOfLines={2}>
                  "{row.comment}"
                </Text>
              ))}
          </>
        )}
      </View>

      {!loadingExisting && myRating !== null && !editing && (
        <View style={styles.myRatingBlock}>
          <Text style={styles.myRatingLabel}>YOUR RATING · {formatRatedAt(myRating.ratedAt)}</Text>
          <Text style={styles.myRatingLine}>
            Accuracy <Text style={styles.myRatingStars}>{starString(myRating.accuracy)}</Text>
          </Text>
          <Text style={styles.myRatingLine}>
            Accommodation <Text style={styles.myRatingStars}>{starString(myRating.accommodation)}</Text>
          </Text>
          {myRating.comment ? <Text style={styles.commentPreview}>"{myRating.comment}"</Text> : null}
          {justSaved && (
            <Text style={styles.successText}>
              {justSaved === 'updated' ? 'Your rating was updated.' : 'Thanks for your rating!'}
            </Text>
          )}
          <TouchableOpacity accessibilityRole="button" onPress={startEditing} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Edit your rating</Text>
          </TouchableOpacity>
          <Text style={styles.onePerDevice}>You can rate each restaurant once; editing replaces your rating.</Text>
        </View>
      )}

      {!loadingExisting && myRating === null && !formOpen && (
        <TouchableOpacity accessibilityRole="button" onPress={() => setFormOpen(true)} style={styles.rateButton}>
          <Ionicons name="star-outline" size={16} color={colors.brand} />
          <Text style={styles.rateButtonText}>Rate this restaurant</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <>
          {editing && <Text style={styles.editingLabel}>Editing your rating</Text>}
          <StarPicker
            label="How accurate was Safe Bites' info?"
            value={accuracyRating}
            onChange={setAccuracyRating}
            disabled={submitting}
          />
          <StarPicker
            label="How well did the restaurant accommodate you?"
            value={accommodationRating}
            onChange={setAccommodationRating}
            disabled={submitting}
          />

          <Text style={styles.pickerLabel}>Comment (optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us more about your experience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={MAX_RATING_COMMENT_LENGTH}
            editable={!submitting}
          />

          {validationMessage ? <Text style={styles.errorText}>{validationMessage}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity accessibilityRole="button"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{editing ? 'Update rating' : 'Submit rating'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              setEditing(false);
              setFormOpen(false);
              setValidationMessage(null);
              setError(null);
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkButtonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 18,
  },
  rateButtonText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '600',
  },
  myRatingBlock: {
    backgroundColor: '#eef4f6',
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  myRatingLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  myRatingLine: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  myRatingStars: {
    color: colors.rating,
    letterSpacing: 1,
  },
  onePerDevice: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand,
    marginBottom: 8,
  },
  summaryBlock: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  commentPreview: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  pickerBlock: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 28,
    color: colors.border,
  },
  starTextFilled: {
    color: colors.rating,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.brand,
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.safe,
    marginBottom: 8,
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkButtonText: {
    color: colors.brand,
    fontWeight: '500',
  },
});
