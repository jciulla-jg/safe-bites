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

export function RatingsSection({ osmId, restaurantName, onSubmitted }: RatingsSectionProps) {
  const [accuracyRating, setAccuracyRating] = useState<number | null>(null);
  const [accommodationRating, setAccommodationRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // True when this device had rated before, so the submit replaced that rating.
  const [updatedExisting, setUpdatedExisting] = useState(false);
  // Set once this device has rated here this session: the form then edits that rating.
  const [hasMyRating, setHasMyRating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const [existingRatings, setExistingRatings] = useState<RatingRow[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [existingError, setExistingError] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    setLoadingExisting(true);
    setExistingError(null);
    const { data, error: fetchError } = await supabase
      .from('ratings')
      .select('*')
      .eq('osm_id', osmId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setExistingError('Could not load existing ratings.');
    } else {
      setExistingRatings(data ?? []);
    }
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

    setSubmitted(true);
    setUpdatedExisting(existed === true);
    setHasMyRating(true);
    loadExisting();
    onSubmitted?.();
  };

  // Each device has one rating per restaurant (0010), so "again" means edit:
  // keep the stars and comment just submitted, ready to change.
  const handleEditRating = () => {
    setSubmitted(false);
    setError(null);
    setValidationMessage(null);
  };

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

      {submitted ? (
        <View style={styles.successBlock}>
          <Text style={styles.successText}>
            {updatedExisting ? 'Your rating was updated.' : 'Thanks for your rating!'}
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={handleEditRating} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Edit your rating</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
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
              <Text style={styles.submitButtonText}>{hasMyRating ? 'Update rating' : 'Submit rating'}</Text>
            )}
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
  successBlock: {
    alignItems: 'flex-start',
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
