/**
 * Tiny switchboard so any screen can open the picture picker / editor that lives once in App.
 * The picture is either your own profile picture or the picture of a business (for example Axis Bank),
 * which is then used for every message from that business.
 */
export type PhotoTarget = { type: 'profile' } | { type: 'business'; key: string; name: string };

type Action = 'choose' | 'edit';
type Listener = (action: Action, target: PhotoTarget) => void;

const listeners = new Set<Listener>();
const PROFILE: PhotoTarget = { type: 'profile' };

export const profilePhotoEditor = {
  /** Pick a new photo from the phone, then edit it. */
  choose: (target: PhotoTarget = PROFILE) => listeners.forEach((l) => l('choose', target)),
  /** Edit the current photo again (falls back to picking one if there is none). */
  edit: (target: PhotoTarget = PROFILE) => listeners.forEach((l) => l('edit', target)),
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
