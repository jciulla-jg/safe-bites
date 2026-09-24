import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALLERGENS } from '../data/allergens';
import { ALLERGEN_TAG_INFO } from '../data/allergenTagInfo';
import type { AllergenStatus } from '../lib/database.types';
import {
  deleteCommunityMenuItem,
  fetchCommunityMenuItems,
  submitCommunityMenuItem,
  updateCommunityMenuItem,
  type CommunityMenuItem,
  type CommunityMenuItemInput,
  type CommunityMenuItemTag,
} from '../lib/communityMenu';
import { loadOwnedSubmissions, type OwnedSubmissions } from '../lib/ownedSubmissions';
import { loadReportedIds, reportSubmission } from '../lib/reports';
import { colors } from '../navigation/theme';
import { friendlySubmitError } from '../lib/errors';
import { StatusPicker, StepLabel } from './StatusPicker';
import { MentionBadge } from './MentionBadge';
import { itemMentions } from '../lib/mentions';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function allergenLabelOf(code: string): string {
  return ALLERGENS.find((a) => a.code === code)?.label ?? code;
}

function TagBadges({ tags, onRemove }: { tags: CommunityMenuItemTag[]; onRemove?: (code: string) => void }) {
  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => {
        const info = ALLERGEN_TAG_INFO[tag.status];
        const text = `${allergenLabelOf(tag.allergenCode)}: ${info.label}${onRemove ? '  ✕' : ''}`;
        const badge = (
          <View style={[styles.tagBadge, { borderColor: info.color }]}>
            <Text style={[styles.tagBadgeText, { color: info.color }]}>{text}</Text>
          </View>
        );
        return onRemove ? (
          <TouchableOpacity key={tag.allergenCode} onPress={() => onRemove(tag.allergenCode)} accessibilityRole="button" accessibilityLabel={`Remove tag ${allergenLabelOf(tag.allergenCode)}`}>
            {badge}
          </TouchableOpacity>
        ) : (
          <View key={tag.allergenCode}>{badge}</View>
        );
      })}
    </View>
  );
}

/**
 * For a restaurant with no reviewed safety data (RestaurantDetailScreen's
 * `notFound` state): lets any diner add a menu item they know of, with
 * allergen tags, entirely separate from the curated data -- see
 * communityMenu.ts. Every item is labeled "Community-submitted, unverified"
 * and never becomes reviewed data. Items submitted from this device can be
 * edited or deleted by it (ownedSubmissions.ts).
 */
export function CommunityMenuSection({
  osmId,
  restaurantName,
  customKeywords,
  onItemsChange,
  hasReviewedMenu = false,
}: {
  osmId: number;
  restaurantName: string;
  customKeywords: string[];
  /** Called with the visible items whenever they load or change (for the page's item count). */
  onItemsChange?: (items: CommunityMenuItem[]) => void;
  /** True when the restaurant also has a reviewed menu shown above this section. */
  hasReviewedMenu?: boolean;
}) {
  const [items, setItems] = useState<CommunityMenuItem[]>([]);
  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);
  const [owned, setOwned] = useState<OwnedSubmissions>({});
  const [loading, setLoading] = useState(true);

  // null = form closed; 'new' = adding; otherwise the id of the item being edited.
  const [formMode, setFormMode] = useState<'new' | string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [pendingTags, setPendingTags] = useState<CommunityMenuItemTag[]>([]);
  const [tagAllergen, setTagAllergen] = useState<string | null>(null);
  const [tagStatus, setTagStatus] = useState<AllergenStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [confirmingReportId, setConfirmingReportId] = useState<string | null>(null);

  async function confirmReport(item: CommunityMenuItem) {
    setDeletingId(item.id);
    setRowError(null);
    try {
      await reportSubmission('community_item', item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      setConfirmingReportId(null);
    } catch (err) {
      setRowError({ id: item.id, message: friendlySubmitError(err, 'Could not report. Please try again.') });
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCommunityMenuItems(osmId), loadOwnedSubmissions(), loadReportedIds()]).then(([data, ownedMap, reported]) => {
      if (cancelled) return;
      // Items this device has reported stay hidden even before the server hides them (3 reports).
      setItems(data.filter((item) => !reported.has(item.id)));
      setOwned(ownedMap);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [osmId]);

  function openForm(item?: CommunityMenuItem) {
    setFormMode(item ? item.id : 'new');
    setName(item?.name ?? '');
    setDescription(item?.description ?? '');
    setPrice(item?.price !== null && item?.price !== undefined ? String(item.price) : '');
    setPendingTags(item?.tags ?? []);
    setTagAllergen(null);
    setTagStatus(null);
    setError(null);
    setConfirmingDeleteId(null);
  }

  function closeForm() {
    setFormMode(null);
    setError(null);
  }

  function addPendingTag() {
    if (!tagAllergen || !tagStatus) return;
    setPendingTags((prev) => [
      ...prev.filter((t) => t.allergenCode !== tagAllergen),
      { allergenCode: tagAllergen, status: tagStatus },
    ]);
    setTagAllergen(null);
    setTagStatus(null);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Give the item a name first.');
      return;
    }
    const parsedPrice = price.trim() ? Number(price.trim()) : undefined;
    if (parsedPrice !== undefined && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      setError('Price should be a number, like 12.99.');
      return;
    }
    // A picked-but-not-added tag is almost always a forgotten "+ Add tag" tap.
    const tags =
      tagAllergen && tagStatus
        ? [...pendingTags.filter((t) => t.allergenCode !== tagAllergen), { allergenCode: tagAllergen, status: tagStatus }]
        : pendingTags;
    const input: CommunityMenuItemInput = { name, description, price: parsedPrice, tags };

    setError(null);
    setSubmitting(true);
    try {
      if (formMode === 'new') {
        const item = await submitCommunityMenuItem(osmId, restaurantName, input);
        setItems((prev) => [item, ...prev]);
        setOwned(await loadOwnedSubmissions());
      } else if (formMode) {
        const secret = owned[formMode];
        if (!secret) throw new Error('not owned');
        await updateCommunityMenuItem(formMode, secret, input);
        const trimmedDescription = description.trim();
        setItems((prev) =>
          prev.map((it) =>
            it.id === formMode
              ? {
                  ...it,
                  name: name.trim(),
                  description: trimmedDescription ? trimmedDescription : null,
                  price: parsedPrice ?? null,
                  tags,
                  updatedAt: new Date().toISOString(),
                }
              : it
          )
        );
      }
      closeForm();
    } catch (err) {
      setError(
        friendlySubmitError(
          err,
          formMode === 'new' ? 'Could not submit this item. Please try again.' : 'Could not save changes. Please try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete(item: CommunityMenuItem) {
    const secret = owned[item.id];
    if (!secret) return;
    setDeletingId(item.id);
    setRowError(null);
    try {
      await deleteCommunityMenuItem(item.id, secret);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      setConfirmingDeleteId(null);
    } catch {
      setRowError({ id: item.id, message: 'Could not delete. Please try again.' });
    } finally {
      setDeletingId(null);
    }
  }

  const editing = formMode !== null && formMode !== 'new';

  const form = (
    <View style={styles.form}>
      <Text style={styles.formTitle}>{editing ? 'Edit your menu item' : 'Add a menu item'}</Text>

      <Text style={styles.fieldLabel}>Item name</Text>
      <TextInput style={styles.textInput} placeholder="e.g. Pad Thai" value={name} onChangeText={setName} editable={!submitting} />

      <Text style={styles.fieldLabel}>Description (optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="What's in it?"
        value={description}
        onChangeText={setDescription}
        editable={!submitting}
      />

      <Text style={styles.fieldLabel}>Price (optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. 12.99"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        editable={!submitting}
      />

      <View style={styles.tagBuilder}>
        <Text style={styles.tagBuilderTitle}>Allergen tags (optional)</Text>
        {pendingTags.length > 0 ? (
          <>
            <TagBadges tags={pendingTags} onRemove={(code) => setPendingTags((prev) => prev.filter((t) => t.allergenCode !== code))} />
            <Text style={styles.hint}>Tap a tag to remove it.</Text>
          </>
        ) : (
          <Text style={styles.hint}>No tags yet. Add one tag for each allergen you know about.</Text>
        )}

        <StepLabel step={1} text="Pick an allergen" />
        <View style={styles.chipRow}>
          {ALLERGENS.map((allergen) => (
            <TouchableOpacity
              key={allergen.code}
              style={[styles.chip, tagAllergen === allergen.code && styles.chipSelected]} accessibilityRole="button" accessibilityState={{ selected: tagAllergen === allergen.code }} aria-selected={tagAllergen === allergen.code}
              onPress={() => setTagAllergen(allergen.code)}
            >
              <Text style={[styles.chipText, tagAllergen === allergen.code && styles.chipTextSelected]}>
                {allergen.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <StepLabel
          step={2}
          text={tagAllergen ? `Does it contain ${allergenLabelOf(tagAllergen)}?` : 'Does it contain it?'}
        />
        <StatusPicker value={tagStatus} onChange={setTagStatus} disabled={submitting} />

        <TouchableOpacity accessibilityRole="button"
          style={[styles.addTagButton, (!tagAllergen || !tagStatus) && styles.addTagButtonDisabled]}
          onPress={addPendingTag}
          disabled={!tagAllergen || !tagStatus}
        >
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={styles.addTagButtonText}>
            {tagAllergen && tagStatus
              ? `Add "${allergenLabelOf(tagAllergen)}: ${ALLERGEN_TAG_INFO[tagStatus].label}"`
              : 'Add tag'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.formActionRow}>
        <TouchableOpacity accessibilityRole="button" style={styles.cancelButton} onPress={closeForm} disabled={submitting}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button"
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{editing ? 'Save changes' : 'Submit item'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        Submitted by other diners, not verified by Safe Bites. Always confirm with the restaurant
        directly if you have a serious allergy. You can edit or delete items you submit from this
        device.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{hasReviewedMenu ? 'Community additions' : 'Community menu items'}</Text>
      <Text style={styles.subtitle}>
        {hasReviewedMenu
          ? "Something on the menu that isn't listed above? Add it — diner-submitted, not verified by Safe Bites, and kept separate from the reviewed menu."
          : "Know what's on the menu here? Add it — diner-submitted, not verified by Safe Bites."}
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.brand} style={styles.loadingIndicator} />
      ) : (
        items.length > 0 && (
          <>
          <View style={styles.itemList}>
            {items.map((item) => {
              if (formMode === item.id) {
                return <View key={item.id}>{form}</View>;
              }
              const mine = !!owned[item.id];
              const deleting = deletingId === item.id;
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeaderRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.price !== null && <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>}
                  </View>
                  <Text style={styles.unverifiedTag}>
                    {mine ? 'YOUR SUBMISSION' : 'COMMUNITY-SUBMITTED'} · UNVERIFIED · {formatDate(item.createdAt)}
                    {item.updatedAt ? ' · EDITED' : ''}
                  </Text>
                  {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                  {item.tags.length > 0 && <TagBadges tags={item.tags} />}
                  {itemMentions(item, customKeywords).length > 0 && (
                    <View style={styles.tagRow}>
                      {itemMentions(item, customKeywords).map((keyword) => (
                        <MentionBadge key={keyword} keyword={keyword} />
                      ))}
                    </View>
                  )}

                  {mine &&
                    (confirmingDeleteId === item.id ? (
                      <View style={styles.rowActions}>
                        <Text style={styles.confirmText}>Delete this item?</Text>
                        <TouchableOpacity accessibilityRole="button" onPress={() => setConfirmingDeleteId(null)} disabled={deleting}>
                          <Text style={styles.secondaryAction}>Keep</Text>
                        </TouchableOpacity>
                        <TouchableOpacity accessibilityRole="button" onPress={() => confirmDelete(item)} disabled={deleting}>
                          {deleting ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                          ) : (
                            <Text style={styles.dangerAction}>Delete</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.rowActions}>
                        <TouchableOpacity accessibilityRole="button" onPress={() => openForm(item)} disabled={formMode !== null}>
                          <Text style={[styles.primaryAction, formMode !== null && styles.actionDisabled]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity accessibilityRole="button"
                          onPress={() => {
                            setConfirmingDeleteId(item.id);
                            setRowError(null);
                          }}
                          disabled={formMode !== null}
                        >
                          <Text style={[styles.dangerAction, formMode !== null && styles.actionDisabled]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  {!mine &&
                    (confirmingReportId === item.id ? (
                      <View style={styles.rowActions}>
                        <Text style={styles.confirmText}>Report as wrong or inappropriate?</Text>
                        <TouchableOpacity accessibilityRole="button" onPress={() => setConfirmingReportId(null)} disabled={deleting}>
                          <Text style={styles.secondaryAction}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity accessibilityRole="button" onPress={() => confirmReport(item)} disabled={deleting}>
                          {deleting ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                          ) : (
                            <Text style={styles.dangerAction}>Report</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.rowActions}>
                        <TouchableOpacity
                          onPress={() => setConfirmingReportId(item.id)}
                          disabled={formMode !== null}
                          accessibilityRole="button"
                          accessibilityLabel={`Report ${item.name}`}
                        >
                          <Text style={[styles.secondaryAction, formMode !== null && styles.actionDisabled]}>Report</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  {rowError?.id === item.id && <Text style={styles.errorText}>{rowError.message}</Text>}
                </View>
              );
            })}
          </View>
          </>
        )
      )}

      {formMode === 'new' ? (
        form
      ) : (
        formMode === null && (
          <TouchableOpacity style={styles.addButton} onPress={() => openForm()} accessibilityRole="button">
            <Ionicons name="add-circle-outline" size={16} color={colors.brand} />
            <Text style={styles.addButtonText}>Add a menu item</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    marginBottom: 10,
    lineHeight: 16,
  },
  loadingIndicator: {
    marginVertical: 12,
  },
  itemList: {
    marginBottom: 12,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  itemPrice: {
    color: '#444',
    fontWeight: '600',
    fontSize: 13,
  },
  unverifiedTag: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  itemDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
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
  actionDisabled: {
    opacity: 0.4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 18,
  },
  addButtonText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: colors.card,
  },
  tagBuilder: {
    marginTop: 14,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tagBuilderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
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
    backgroundColor: colors.background,
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
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.brandDark,
    marginTop: 10,
  },
  addTagButtonDisabled: {
    opacity: 0.4,
  },
  addTagButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 10,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.brand,
    paddingVertical: 10,
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
  disclaimer: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
});
