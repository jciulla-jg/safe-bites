import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALLERGENS } from '../data/allergens';
import { ALLERGEN_TAG_INFO } from '../data/allergenTagInfo';
import type { AllergenStatus } from '../lib/database.types';
import {
  deleteMenuItemFeedback,
  submitMenuItemFeedback,
  updateMenuItemFeedback,
  type MenuItemFeedbackEntry,
} from '../lib/menuItemFeedback';
import { loadOwnedSubmissions, type OwnedSubmissions } from '../lib/ownedSubmissions';
import { loadReportedIds, reportSubmission } from '../lib/reports';
import { colors } from '../navigation/theme';
import { friendlySubmitError } from '../lib/errors';
import { StatusPicker, StepLabel } from './StatusPicker';

function formatFeedbackDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function allergenLabelOf(code: string): string {
  return ALLERGENS.find((a) => a.code === code)?.label ?? code;
}

/**
 * Per-menu-item "community feedback" -- lets any diner submit their own read
 * on whether an item is safe/contains/may-contain an allergen, and shows
 * what others have submitted. Explicitly NOT the same as the reviewed
 * allergen tag above it (AllergenTagBadge): every entry here is labeled
 * "User feedback (unverified)" and never changes computeSafetyStatus/
 * countSafeItems -- see menuItemFeedback.ts. Entries submitted from this
 * device can be edited or deleted by it (ownedSubmissions.ts).
 */
export function MenuItemFeedback({
  menuItemId,
  entries,
  onEntriesChange,
}: {
  menuItemId: string;
  entries: MenuItemFeedbackEntry[];
  onEntriesChange: (entries: MenuItemFeedbackEntry[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [owned, setOwned] = useState<OwnedSubmissions>({});

  const [allergenCode, setAllergenCode] = useState<string | null>(null);
  const [status, setStatus] = useState<AllergenStatus | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AllergenStatus | null>(null);
  const [editComment, setEditComment] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const [reported, setReported] = useState<Set<string>>(new Set());
  const [confirmingReportId, setConfirmingReportId] = useState<string | null>(null);

  useEffect(() => {
    if (expanded) loadOwnedSubmissions().then(setOwned);
  }, [expanded]);

  useEffect(() => {
    loadReportedIds().then(setReported);
  }, []);

  // Entries this device has reported stay hidden here even before the server
  // hides them (at 3 reports).
  const visibleEntries = entries.filter((e) => !reported.has(e.id));

  async function confirmReport(entry: MenuItemFeedbackEntry) {
    setRowBusyId(entry.id);
    setRowError(null);
    try {
      await reportSubmission('feedback', entry.id);
      setReported((prev) => new Set(prev).add(entry.id));
      setConfirmingReportId(null);
    } catch (err) {
      setRowError({ id: entry.id, message: friendlySubmitError(err, 'Could not report. Please try again.') });
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleSubmit() {
    if (!allergenCode || !status) {
      setError('Pick an allergen (step 1) and what you found (step 2) first.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const entry = await submitMenuItemFeedback({ menuItemId, allergenCode, status, comment });
      onEntriesChange([entry, ...entries]);
      setOwned(await loadOwnedSubmissions());
      setJustSubmitted(true);
      setAllergenCode(null);
      setStatus(null);
      setComment('');
    } catch (err) {
      setError(friendlySubmitError(err, 'Could not submit feedback. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry: MenuItemFeedbackEntry) {
    setEditingId(entry.id);
    setEditStatus(entry.status);
    setEditComment(entry.comment ?? '');
    setConfirmingDeleteId(null);
    setRowError(null);
  }

  async function saveEdit(entry: MenuItemFeedbackEntry) {
    const secret = owned[entry.id];
    if (!secret || !editStatus) return;
    setRowBusyId(entry.id);
    setRowError(null);
    try {
      await updateMenuItemFeedback(entry.id, secret, { status: editStatus, comment: editComment });
      const trimmed = editComment.trim();
      onEntriesChange(
        entries.map((e) =>
          e.id === entry.id
            ? { ...e, status: editStatus, comment: trimmed ? trimmed : null, updatedAt: new Date().toISOString() }
            : e
        )
      );
      setEditingId(null);
    } catch (err) {
      setRowError({ id: entry.id, message: friendlySubmitError(err, 'Could not save changes. Please try again.') });
    } finally {
      setRowBusyId(null);
    }
  }

  async function confirmDelete(entry: MenuItemFeedbackEntry) {
    const secret = owned[entry.id];
    if (!secret) return;
    setRowBusyId(entry.id);
    setRowError(null);
    try {
      await deleteMenuItemFeedback(entry.id, secret);
      onEntriesChange(entries.filter((e) => e.id !== entry.id));
      setConfirmingDeleteId(null);
    } catch {
      setRowError({ id: entry.id, message: 'Could not delete. Please try again.' });
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleRow} onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded }} aria-expanded={expanded}>
        <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.toggleText}>
          Community feedback{visibleEntries.length > 0 ? ` (${visibleEntries.length})` : ''}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {visibleEntries.length > 0 && (
            <View style={styles.entryList}>
              {visibleEntries.map((entry) => {
                const info = ALLERGEN_TAG_INFO[entry.status];
                const mine = !!owned[entry.id];
                const busy = rowBusyId === entry.id;
                return (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={styles.entryHeaderRow}>
                      <Text style={styles.unverifiedTag}>
                        {mine ? 'YOUR FEEDBACK · UNVERIFIED' : 'USER FEEDBACK · UNVERIFIED'}
                      </Text>
                      <Text style={styles.entryDate}>
                        {formatFeedbackDate(entry.createdAt)}
                        {entry.updatedAt ? ' · edited' : ''}
                      </Text>
                    </View>

                    {editingId === entry.id ? (
                      <View style={styles.editBlock}>
                        <Text style={styles.entryClaim}>{allergenLabelOf(entry.allergenCode)}:</Text>
                        <View style={styles.editPicker}>
                          <StatusPicker value={editStatus} onChange={setEditStatus} disabled={busy} />
                        </View>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="Optional: what did the restaurant tell you?"
                          value={editComment}
                          onChangeText={setEditComment}
                          multiline
                          editable={!busy}
                        />
                        <View style={styles.rowActions}>
                          <TouchableOpacity accessibilityRole="button" onPress={() => setEditingId(null)} disabled={busy}>
                            <Text style={styles.secondaryAction}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity accessibilityRole="button" onPress={() => saveEdit(entry)} disabled={busy}>
                            {busy ? (
                              <ActivityIndicator size="small" color={colors.brand} />
                            ) : (
                              <Text style={styles.primaryAction}>Save</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.entryClaim}>
                          {allergenLabelOf(entry.allergenCode)}:{' '}
                          <Text style={{ color: info.color, fontWeight: '700' }}>{info.label}</Text>
                        </Text>
                        {entry.comment && <Text style={styles.entryComment}>"{entry.comment}"</Text>}

                        {mine &&
                          (confirmingDeleteId === entry.id ? (
                            <View style={styles.rowActions}>
                              <Text style={styles.confirmText}>Delete this feedback?</Text>
                              <TouchableOpacity accessibilityRole="button" onPress={() => setConfirmingDeleteId(null)} disabled={busy}>
                                <Text style={styles.secondaryAction}>Keep</Text>
                              </TouchableOpacity>
                              <TouchableOpacity accessibilityRole="button" onPress={() => confirmDelete(entry)} disabled={busy}>
                                {busy ? (
                                  <ActivityIndicator size="small" color={colors.danger} />
                                ) : (
                                  <Text style={styles.dangerAction}>Delete</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.rowActions}>
                              <TouchableOpacity accessibilityRole="button" onPress={() => startEdit(entry)}>
                                <Text style={styles.primaryAction}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity accessibilityRole="button"
                                onPress={() => {
                                  setConfirmingDeleteId(entry.id);
                                  setEditingId(null);
                                  setRowError(null);
                                }}
                              >
                                <Text style={styles.dangerAction}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        {!mine &&
                          (confirmingReportId === entry.id ? (
                            <View style={styles.rowActions}>
                              <Text style={styles.confirmText}>Report as wrong or inappropriate?</Text>
                              <TouchableOpacity accessibilityRole="button" onPress={() => setConfirmingReportId(null)} disabled={busy}>
                                <Text style={styles.secondaryAction}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity accessibilityRole="button" onPress={() => confirmReport(entry)} disabled={busy}>
                                {busy ? (
                                  <ActivityIndicator size="small" color={colors.danger} />
                                ) : (
                                  <Text style={styles.dangerAction}>Report</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.rowActions}>
                              <TouchableOpacity
                                onPress={() => setConfirmingReportId(entry.id)}
                                accessibilityRole="button"
                                accessibilityLabel="Report this feedback"
                              >
                                <Text style={styles.secondaryAction}>Report</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                      </>
                    )}
                    {rowError?.id === entry.id && <Text style={styles.errorText}>{rowError.message}</Text>}
                  </View>
                );
              })}
            </View>
          )}

          {justSubmitted ? (
            <View>
              <Text style={styles.thanksText}>Thanks — your feedback was added above.</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => setJustSubmitted(false)}>
                <Text style={styles.primaryAction}>Add more feedback</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.formTitle}>Add your feedback</Text>

              <StepLabel step={1} text="Which allergen?" />
              <View style={styles.chipRow}>
                {ALLERGENS.map((allergen) => (
                  <TouchableOpacity
                    key={allergen.code}
                    style={[styles.chip, allergenCode === allergen.code && styles.chipSelected]} accessibilityRole="button" accessibilityState={{ selected: allergenCode === allergen.code }} aria-selected={allergenCode === allergen.code}
                    onPress={() => setAllergenCode(allergen.code)}
                  >
                    <Text style={[styles.chipText, allergenCode === allergen.code && styles.chipTextSelected]}>
                      {allergen.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <StepLabel
                step={2}
                text={allergenCode ? `What did you find about ${allergenLabelOf(allergenCode)}?` : 'What did you find?'}
              />
              <StatusPicker value={status} onChange={setStatus} disabled={submitting} />

              <StepLabel step={3} text="Anything else? (optional)" />
              <TextInput
                style={styles.commentInput}
                placeholder="e.g. what the restaurant told you"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={2}
                editable={!submitting}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity accessibilityRole="button"
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit feedback</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Submitted by other diners, not verified by Safe Bites. Always confirm with the
                restaurant directly if you have a serious allergy. You can edit or delete feedback
                you submit from this device.
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  toggleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  entryList: {
    marginBottom: 6,
  },
  entryRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unverifiedTag: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  entryDate: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  entryClaim: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textPrimary,
  },
  entryComment: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  editBlock: {
    marginTop: 2,
  },
  editPicker: {
    marginTop: 6,
    marginBottom: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  confirmText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  primaryAction: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 2,
  },
  secondaryAction: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 2,
  },
  dangerAction: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 2,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: colors.card,
  },
  chipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontSize: 12,
    color: '#3a3f37',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    minHeight: 50,
    textAlignVertical: 'top',
    fontSize: 13,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: colors.brand,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  thanksText: {
    color: colors.safe,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
});
