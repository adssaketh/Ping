import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  Check,
  ChevronLeft,
  ExternalLink,
  MessageSquare,
  Palette,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { smsBridge, isNativeAndroid, SetupStatus } from '../services/smsBridge.ts';
import { useSMS } from '../context/SMSContext.tsx';
import { useBackHandler } from '../backStack.ts';
import { springBouncy } from '../motion.ts';
import { ThemePicker } from './ThemePicker.tsx';
import { getRestrictedAck, markSetupDone, setRestrictedAck } from '../utils/setupFlag.ts';

type PermGroup = 'sms' | 'notifications' | 'contacts';
type StepId = 'welcome' | 'theme' | 'restricted' | 'sms' | 'notifications' | 'contacts' | 'summary';

/** Wording matches PRIVACY.md: what each permission is for, and that contacts are read-only. */
const PERM_COPY: Record<
  PermGroup,
  { title: string; label: string; reason: string; Icon: React.ElementType; settings: 'app' | 'notifications' }
> = {
  sms: {
    title: 'Read and send SMS',
    label: 'SMS',
    reason:
      'Ping shows your conversations, receives new texts and sends the ones you write. Messages stay on your phone; sending uses your normal carrier SMS.',
    Icon: MessageSquare,
    settings: 'app',
  },
  notifications: {
    title: 'Notifications',
    label: 'Notifications',
    reason: 'Get an alert when a message arrives, with a Copy OTP button for one-time codes.',
    Icon: Bell,
    settings: 'notifications',
  },
  contacts: {
    title: 'Contacts',
    label: 'Contacts',
    reason:
      'Show names and photos instead of bare phone numbers. Ping only reads your contacts and never changes them.',
    Icon: Users,
    settings: 'app',
  },
};

const THEME_LABEL = { system: 'System default', light: 'Light', dark: 'Dark' } as const;

const variants = {
  enter: (d: number) => ({ x: d * 56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -56, opacity: 0 }),
};

/* ------------------------------ small building blocks ------------------------------ */

const IconBubble: React.FC<{ children: React.ReactNode; ring?: boolean; ok?: boolean }> = ({ children, ring, ok }) => (
  <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
    {ring && <span className="ob-ring absolute inset-2 rounded-[34px] bg-m3-primary/25 dark:bg-m3-primary-light/25" />}
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springBouncy}
      className="relative w-24 h-24 rounded-[32px] flex items-center justify-center bg-m3-primary-container dark:bg-m3-primary-deep text-m3-on-primary-deep dark:text-m3-primary-container shadow-sm"
    >
      {children}
    </motion.div>
    <AnimatePresence>
      {ok && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={springBouncy}
          className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center border-4 border-m3-surface dark:border-m3-d0"
        >
          <Check className="w-4 h-4" strokeWidth={3} />
        </motion.span>
      )}
    </AnimatePresence>
  </div>
);

const Chip: React.FC<{ ok: boolean; okLabel?: string; noLabel?: string }> = ({
  ok,
  okLabel = 'Granted',
  noLabel = 'Not granted',
}) => (
  <span
    role="status"
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
      ok
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
        : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}`} />
    {ok ? okLabel : noLabel}
  </span>
);

const PrimaryButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({
  onClick,
  disabled,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full min-h-12 px-6 rounded-full bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
  >
    {children}
  </button>
);

const TonalButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full min-h-12 px-6 rounded-full bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light text-sm font-semibold flex items-center justify-center gap-2"
  >
    {children}
  </button>
);

const TextButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full min-h-11 px-6 rounded-full text-sm font-semibold text-m3-variant dark:text-m3-variant-dk"
  >
    {children}
  </button>
);

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.h2
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.08, duration: 0.3 }}
    className="mt-6 text-2xl font-bold text-center text-m3-on-surface dark:text-white"
  >
    {children}
  </motion.h2>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.p
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.14, duration: 0.3 }}
    className="mt-2 text-sm leading-relaxed text-center max-w-sm text-m3-variant dark:text-m3-variant-dk"
  >
    {children}
  </motion.p>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full max-w-sm rounded-3xl p-4 bg-white dark:bg-m3-d1 border border-m3-line dark:border-m3-d4 text-sm text-m3-variant dark:text-m3-variant-dk">
    {children}
  </div>
);

/** Scrollable body + pinned buttons, so large font sizes never push the buttons off screen. */
const StepLayout: React.FC<{ body: React.ReactNode; actions: React.ReactNode }> = ({ body, actions }) => (
  <>
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center py-4">{body}</div>
    </div>
    <div className="shrink-0 w-full max-w-sm mx-auto flex flex-col gap-2 pt-3">{actions}</div>
  </>
);

/* ------------------------------------ the flow ------------------------------------ */

interface ScreenProps {
  onFinish: () => void;
}

const OnboardingScreen: React.FC<ScreenProps> = ({ onFinish }) => {
  const { settings, checkDefaultSmsApp, syncDeviceSmsAndContacts, requestNotificationPermission } = useSMS();
  const native = isNativeAndroid();

  const [status, setStatus] = useState<SetupStatus | null>(null);
  const statusRef = useRef<SetupStatus | null>(null);
  const initialRef = useRef<SetupStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [restrictedAck, setRestrictedAckState] = useState<boolean>(() => getRestrictedAck());
  const [stepId, setStepId] = useState<StepId>('welcome');
  const [dir, setDir] = useState<1 | -1>(1);
  const stepRef = useRef<StepId>('welcome');
  stepRef.current = stepId;

  const sdkInt = status?.sdkInt ?? 0;
  const showRestricted = native && sdkInt >= 33;
  const steps: StepId[] = useMemo(
    () => ['welcome', 'theme', ...(showRestricted ? (['restricted'] as StepId[]) : []), 'sms', 'notifications', 'contacts', 'summary'],
    [showRestricted]
  );
  const index = Math.max(0, steps.indexOf(stepId));

  const goTo = useCallback(
    (to: StepId) => {
      const from = steps.indexOf(stepRef.current);
      const target = steps.indexOf(to);
      setDir(target >= from ? 1 : -1);
      setStepId(to);
    },
    [steps]
  );
  const goNext = useCallback(() => {
    const i = steps.indexOf(stepRef.current);
    if (i >= 0 && i < steps.length - 1) goTo(steps[i + 1]);
  }, [steps, goTo]);
  const goPrev = useCallback(() => {
    const i = steps.indexOf(stepRef.current);
    if (i > 0) goTo(steps[i - 1]);
  }, [steps, goTo]);

  // Re-check every permission whenever the user comes back (from the permission dialog or from Android settings)
  const refresh = useCallback(async () => {
    const s = await smsBridge.getSetupStatus();
    statusRef.current = s;
    if (!initialRef.current) initialRef.current = s;
    setStatus(s);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    smsBridge
      .listenToAppResume(() => {
        refresh();
      })
      .then((unsub) => {
        if (cancelled) unsub();
        else unsubscribe = unsub;
      });
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      if (unsubscribe) unsubscribe();
    };
  }, [refresh]);

  const autoAdvance = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(autoAdvance.current), []);

  const grant = async (group: PermGroup) => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await smsBridge.requestSetupPermission(group);
      statusRef.current = next;
      setStatus(next);
      if (next[group]) {
        // keep the rest of the app's own state in step (it tracks notifications separately)
        if (group === 'notifications') void requestNotificationPermission();
        const grantedOn = stepRef.current;
        window.clearTimeout(autoAdvance.current);
        autoAdvance.current = window.setTimeout(() => {
          if (stepRef.current === grantedOn) goNext();
        }, 900);
      }
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    markSetupDone();
    const initial = initialRef.current;
    const latest = statusRef.current;
    onFinish();
    try {
      await checkDefaultSmsApp();
      // permissions that were just granted: load the inbox / contacts now instead of at the next app start
      if (latest && initial && ((latest.sms && !initial.sms) || (latest.contacts && !initial.contacts))) {
        void syncDeviceSmsAndContacts();
      }
    } catch {}
  };

  useBackHandler(true, () => {
    if (stepRef.current !== 'welcome') goPrev();
    else smsBridge.minimizeApp();
  });

  const granted = (g: PermGroup) => !!status && status[g];
  const blockedOf = (g: PermGroup) =>
    !!status && (g === 'sms' ? status.smsBlocked : g === 'notifications' ? status.notificationsBlocked : status.contactsBlocked);

  /* ------------------------------------ step views ------------------------------------ */

  const renderStep = (): React.ReactNode => {
    switch (stepId) {
      case 'welcome':
        return (
          <StepLayout
            body={
              <>
                <IconBubble>
                  <img src="/ping-icon.png" alt="" className="w-16 h-16 rounded-2xl object-cover" />
                </IconBubble>
                <Title>Welcome to Ping</Title>
                <Body>
                  A quick setup gets Ping ready: your theme and a few permissions. Everything is optional, and your
                  messages stay on your phone.
                </Body>
              </>
            }
            actions={<PrimaryButton onClick={goNext}>Start setup</PrimaryButton>}
          />
        );

      case 'theme':
        return (
          <StepLayout
            body={
              <>
                <IconBubble>
                  <Palette className="w-11 h-11" strokeWidth={1.8} />
                </IconBubble>
                <Title>Choose your look</Title>
                <Body>Pick a theme. You can change it later in Settings.</Body>
                <div className="w-full max-w-sm mt-5">
                  <ThemePicker />
                </div>
              </>
            }
            actions={<PrimaryButton onClick={goNext}>Continue</PrimaryButton>}
          />
        );

      case 'restricted':
        return (
          <StepLayout
            body={
              <>
                <IconBubble ring={!restrictedAck} ok={restrictedAck}>
                  <ShieldCheck className="w-11 h-11" strokeWidth={1.8} />
                </IconBubble>
                <Title>Allow restricted settings</Title>
                <Body>
                  If you installed Ping from an APK file instead of an app store, Android 13 and newer can block
                  sensitive permissions until you allow restricted settings. Android 15 added SMS to that list. Without
                  this, the SMS permission may not work.
                </Body>
                <div className="mt-4">
                  <Chip ok={restrictedAck} okLabel="Marked as done" noLabel="Not confirmed" />
                </div>
                <div className="mt-5 w-full max-w-sm">
                  <Card>
                    <ol className="space-y-2.5 list-none">
                      {[
                        'Tap “Open App Info” below.',
                        'Tap the ⋮ three-dot menu at the top right.',
                        'Choose “Allow restricted settings” and confirm.',
                        'Come back to Ping.',
                      ].map((text, i) => (
                        <li key={text} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-m3-primary-container dark:bg-m3-primary-deep text-m3-on-primary-deep dark:text-m3-primary-container">
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{text}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 text-xs">
                      Can’t find the option? On some phones Android only shows it after it has blocked a permission.
                      Continue to the SMS step, tap Grant once, then come back here.
                    </p>
                  </Card>
                </div>
              </>
            }
            actions={
              <>
                <PrimaryButton onClick={() => smsBridge.openAppSettings('app')}>
                  <ExternalLink className="w-4 h-4" />
                  Open App Info
                </PrimaryButton>
                <TonalButton
                  onClick={() => {
                    setRestrictedAck(true);
                    setRestrictedAckState(true);
                    goNext();
                  }}
                >
                  I’ve done this
                </TonalButton>
                <TextButton onClick={goNext}>Skip for now</TextButton>
              </>
            }
          />
        );

      case 'sms':
      case 'notifications':
      case 'contacts': {
        const group: PermGroup = stepId;
        const copy = PERM_COPY[group];
        const ok = granted(group);
        const blocked = blockedOf(group);
        const canAsk = !(group === 'notifications' && sdkInt > 0 && sdkInt < 33);
        const needsSettings = !ok && (blocked || !canAsk);
        return (
          <StepLayout
            body={
              <>
                <IconBubble ring={!ok} ok={ok}>
                  <copy.Icon className="w-11 h-11" strokeWidth={1.8} />
                </IconBubble>
                <Title>{copy.title}</Title>
                <Body>{copy.reason}</Body>
                <div className="mt-4">
                  <Chip ok={ok} />
                </div>
                {needsSettings && (
                  <div className="mt-5 w-full max-w-sm">
                    <Card>
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <p>
                          {group === 'notifications'
                            ? 'Android won’t show a prompt for this. Open Ping’s notification settings and switch notifications on.'
                            : `Android won’t show the permission prompt any more. Open Ping’s settings, choose Permissions and allow ${copy.label}.`}
                          {group === 'sms' && showRestricted
                            ? ' If SMS still can’t be allowed, use the “Allow restricted settings” step first.'
                            : ''}
                        </p>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            }
            actions={
              ok ? (
                <PrimaryButton onClick={goNext}>Continue</PrimaryButton>
              ) : (
                <>
                  {needsSettings ? (
                    <>
                      <PrimaryButton onClick={() => smsBridge.openAppSettings(copy.settings)}>
                        <ExternalLink className="w-4 h-4" />
                        {group === 'notifications' ? 'Open notification settings' : 'Open app settings'}
                      </PrimaryButton>
                      {canAsk && (
                        <TonalButton onClick={() => grant(group)}>{busy ? 'Waiting…' : 'Try Grant again'}</TonalButton>
                      )}
                    </>
                  ) : (
                    <PrimaryButton onClick={() => grant(group)} disabled={busy}>
                      {busy ? 'Waiting…' : 'Grant'}
                    </PrimaryButton>
                  )}
                  <TextButton onClick={goNext}>Skip for now</TextButton>
                </>
              )
            }
          />
        );
      }

      case 'summary': {
        const rows: { key: string; label: string; Icon: React.ElementType; ok: boolean; okLabel?: string; noLabel?: string; fix?: StepId }[] = [
          { key: 'theme', label: `Theme: ${THEME_LABEL[settings.themeMode]}`, Icon: Palette, ok: true, okLabel: 'Set' },
          ...(showRestricted
            ? [
                {
                  key: 'restricted',
                  label: 'Restricted settings',
                  Icon: ShieldCheck,
                  ok: restrictedAck,
                  okLabel: 'Marked as done',
                  noLabel: 'Not confirmed',
                  fix: 'restricted' as StepId,
                },
              ]
            : []),
          ...(['sms', 'notifications', 'contacts'] as PermGroup[]).map((g) => ({
            key: g,
            label: PERM_COPY[g].title,
            Icon: PERM_COPY[g].Icon,
            ok: granted(g),
            fix: g as StepId,
          })),
        ];
        const missing = rows.filter((r) => !r.ok).length;
        return (
          <StepLayout
            body={
              <>
                <IconBubble ok={missing === 0}>
                  <Sparkles className="w-11 h-11" strokeWidth={1.8} />
                </IconBubble>
                <Title>{missing === 0 ? 'You’re all set' : 'Almost there'}</Title>
                <Body>
                  {missing === 0
                    ? 'Everything is ready.'
                    : `${missing} item${missing === 1 ? ' is' : 's are'} still missing. Ping works without them, but some features won’t. You can finish setup any time from Settings.`}
                </Body>
                <div className="mt-5 w-full max-w-sm space-y-2">
                  {rows.map((r) => (
                    <div
                      key={r.key}
                      className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 bg-white dark:bg-m3-d1 border border-m3-line dark:border-m3-d4"
                    >
                      <r.Icon className="w-5 h-5 shrink-0 text-m3-primary dark:text-m3-primary-light" />
                      <span className="flex-1 min-w-0 text-sm font-medium truncate text-m3-on-surface dark:text-m3-on-surface-dk">
                        {r.label}
                      </span>
                      {!r.ok && r.fix ? (
                        <button
                          type="button"
                          onClick={() => goTo(r.fix as StepId)}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light"
                        >
                          Fix
                        </button>
                      ) : null}
                      <Chip ok={r.ok} okLabel={r.okLabel} noLabel={r.noLabel} />
                    </div>
                  ))}
                </div>
              </>
            }
            actions={<PrimaryButton onClick={finish}>Get started</PrimaryButton>}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-m3-surface dark:bg-m3-d0 text-m3-on-surface dark:text-m3-on-surface-dk"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="dialog"
      aria-modal="true"
      aria-label="Ping setup"
    >
      {/* drifting gradient blobs (static when the phone's "remove animations" setting is on) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="ob-blob ob-blob-a -top-24 -left-24 w-80 h-80" />
        <div className="ob-blob ob-blob-b -bottom-28 -right-24 w-96 h-96" />
      </div>

      {/* top row: back, progress dots, skip */}
      <div className="relative z-10 shrink-0 flex items-center justify-between gap-2 px-3 pt-3 pb-1">
        <div className="w-24">
          {index > 0 && stepId !== 'summary' && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Back"
              className="w-11 h-11 rounded-full flex items-center justify-center text-m3-variant dark:text-m3-variant-dk"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>
        <div
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={index + 1}
          className="flex items-center gap-1.5"
        >
          {steps.map((s, i) => (
            <motion.span
              key={s}
              animate={{ width: i === index ? 22 : 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              className={`h-2 rounded-full ${
                i === index
                  ? 'bg-m3-primary dark:bg-m3-primary-light'
                  : i < index
                  ? 'bg-m3-primary/50 dark:bg-m3-primary-light/50'
                  : 'bg-m3-outline/30 dark:bg-m3-outline-dk/30'
              }`}
            />
          ))}
        </div>
        <div className="w-24 flex justify-end">
          {stepId !== 'summary' && (
            <button
              type="button"
              onClick={finish}
              className="px-3 min-h-11 rounded-full text-sm font-semibold text-m3-variant dark:text-m3-variant-dk"
            >
              Skip setup
            </button>
          )}
        </div>
      </div>

      {/* the step */}
      <div className="relative z-10 flex-1 min-h-0">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={stepId}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-0 flex flex-col px-6 pb-6"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * Full-screen first-launch setup. It opens on the first run and again from Settings, and it never blocks the app:
 * every step can be skipped and "Skip setup" is always one tap away.
 */
export const OnboardingFlow: React.FC<{ open: boolean; onFinish: () => void }> = ({ open, onFinish }) => (
  <AnimatePresence>{open && <OnboardingScreen onFinish={onFinish} />}</AnimatePresence>
);
