/**
 * Tiny switchboard so any screen can open the profile picture picker / editor that lives once in App.
 */
type Action = 'choose' | 'edit';
type Listener = (action: Action) => void;

const listeners = new Set<Listener>();

export const profilePhotoEditor = {
  /** Pick a new photo from the phone, then edit it. */
  choose: () => listeners.forEach((l) => l('choose')),
  /** Edit the current photo again (falls back to picking one if there is none). */
  edit: () => listeners.forEach((l) => l('edit')),
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
