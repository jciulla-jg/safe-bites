/**
 * In-app "restrictions changed" signal. The Profile tab saves allergens and
 * custom restrictions; Search and any open restaurant page must re-score
 * immediately. Refreshing only when a screen regains focus left the
 * restaurant page stale (it's often still on top of the Search stack while
 * the diner edits Profile) and could race the save on slower devices, so the
 * save itself announces the change and listeners reload from storage.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function onRestrictionsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyRestrictionsChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}
