import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Bell,
  Baby,
  FileText,
  Lock,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Code,
  Trash2,
  Users,
  WifiOff,
} from 'lucide-react';
import { spring, fadeFast } from '../motion.ts';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LAST_UPDATED = '21 October 2026';

const HIGHLIGHTS = [
  { icon: WifiOff, title: 'Nothing leaves your phone', body: 'Ping never uploads your messages or contacts.' },
  { icon: Users, title: 'No account needed', body: 'No sign-in, no profile, nothing to create.' },
  { icon: ShieldCheck, title: 'No ads or tracking', body: 'No analytics, no advertising, no data sold.' },
  { icon: Trash2, title: 'You are in control', body: 'Remove your data any time from Settings.' },
];

const SECTIONS: { icon: React.ElementType; title: string; body: React.ReactNode }[] = [
  {
    icon: Smartphone,
    title: 'What Ping can access, and why',
    body: (
      <ul className="space-y-2.5">
        <li>
          <strong>SMS and MMS</strong> (read, receive, send): to show your conversations, deliver new messages to
          you and send the messages you write.
        </li>
        <li>
          <strong>Contacts</strong> (read only): to show a name instead of a phone number. Ping never changes your
          contacts.
        </li>
        <li>
          <strong>Notifications</strong>: to alert you to new messages and to offer a Copy OTP button.
        </li>
        <li>
          <strong>Default SMS app role</strong> (optional): lets Ping receive messages and keep Android&rsquo;s own
          message store up to date, for example when you delete or mark a message as read.
        </li>
      </ul>
    ),
  },
  {
    icon: Lock,
    title: 'What stays on your device',
    body: (
      <p>
        Your messages already live in Android&rsquo;s own message store. To open quickly, Ping also keeps a working
        copy of your conversations, contacts, starred messages, drafts, settings and your profile picture (if you add
        one) in the app&rsquo;s private storage on this phone. Ping is excluded from Android cloud backup, so this copy is not uploaded with your
        phone backup. If you use Back up SMS in Settings, the file is saved where you choose. It contains your messages
        in plain, unencrypted text, so keep it somewhere safe.
      </p>
    ),
  },
  {
    icon: WifiOff,
    title: 'What Ping never does',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>It does not collect, upload or share your messages, contacts or phone number.</li>
        <li>It does not use analytics, advertising or tracking tools.</li>
        <li>It does not read your messages out to any online service, including AI services.</li>
        <li>It does not sell or rent any information.</li>
      </ul>
    ),
  },
  {
    icon: ShieldCheck,
    title: 'Spam protection',
    body: (
      <p>
        Ping checks incoming texts for spam and scams on your phone, using a small model that is built into the
        app. It was trained before the app was released on a public collection of Indian SMS messages, so nothing
        you receive is uploaded or used to train anything. Suspected spam is moved to a Spam folder, never
        deleted. When you mark a sender as &ldquo;Not spam&rdquo; or report it as spam, Ping remembers that sender and slightly adjusts a list of word scores learned from those messages. This list holds single words with a small number each, not the messages, and it never leaves your phone. You can erase it with Reset in Settings.
      </p>
    ),
  },
  {
    icon: Send,
    title: 'Sending messages',
    body: (
      <p>
        Text messages are sent through your mobile carrier, the same as in any other SMS app. Your carrier and the
        person you message receive them as normal SMS, and your carrier&rsquo;s own privacy policy and charges
        apply. SMS is not end-to-end encrypted, so avoid sending secrets by text.
      </p>
    ),
  },
  {
    icon: Bell,
    title: 'Notifications and one-time codes',
    body: (
      <p>
        When a message looks like a one-time code, Ping finds the code on your phone and shows a Copy OTP button.
        Tapping it copies the code to your clipboard (marked as sensitive where Android supports it) and nothing
        is sent anywhere. Notifications can show message text on your lock screen depending on your Android
        settings.
      </p>
    ),
  },
  {
    icon: Trash2,
    title: 'Your choices',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Turn permissions off or change the default SMS app at any time in Android settings.</li>
        <li>Deleting a message or conversation in Ping removes it from your phone when Ping is the default SMS app.</li>
        <li>Use Reset in Ping settings, or clear Ping&rsquo;s storage in Android settings, to erase its working copy.</li>
        <li>Uninstalling Ping removes everything it stored.</li>
      </ul>
    ),
  },
  {
    icon: Baby,
    title: 'Children',
    body: <p>Ping is a general-purpose messaging app and does not knowingly collect any information from anyone.</p>,
  },
  {
    icon: RefreshCw,
    title: 'Changes to this policy',
    body: (
      <p>
        If Ping&rsquo;s handling of data ever changes, this page will be updated and the date at the top will change.
        Ping will not start collecting data without telling you here first.
      </p>
    ),
  },
  {
    icon: Code,
    title: 'Open source',
    body: (
      <p>
        Ping is open source. Its code is public at github.com/adssaketh/Ping, so anyone can check that it does what
        this policy says. Its spam protection is built from the Indian Telecom SMS Spam Collection by junioralive
        (github.com/junioralive/india-spam-sms-classification), used under the terms of that repository. Full credits
        are in Settings under Open source &amp; credits.
      </p>
    ),
  },
  {
    icon: Mail,
    title: 'Contact',
    body: (
      <p>
        Questions about privacy? Reach the developer through the Ping project page on GitHub
        (github.com/adssaketh/Ping).
      </p>
    ),
  },
];

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="privacy-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeFast}
        >
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-label="Privacy Policy"
            className="relative w-full max-w-2xl h-full sm:h-[90vh] bg-m3-surface dark:bg-m3-d0 sm:rounded-[32px] border border-m3-line dark:border-m3-d4 shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 64, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={spring}
          >
            {/* Top app bar */}
            <div className="h-16 px-3 flex items-center gap-2 shrink-0 bg-m3-surface dark:bg-m3-d0">
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 text-m3-variant dark:text-m3-variant-dk rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-m3-on-surface dark:text-white">Privacy Policy</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-10">
              {/* Large expressive header */}
              <motion.div
                className="pt-2 pb-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.08 }}
              >
                <div className="w-14 h-14 rounded-[20px] bg-m3-primary-container dark:bg-m3-primary-deep text-m3-primary dark:text-m3-primary-light flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7" />
                </div>
                <h1 className="text-[32px] leading-9 font-bold tracking-tight text-m3-on-surface dark:text-white">
                  Your messages are yours
                </h1>
                <p className="mt-2 text-sm text-m3-variant dark:text-m3-variant-dk leading-relaxed">
                  Ping is an SMS app that works on your phone. This page explains, in plain words, what it can see
                  and what it does with it.
                </p>
                <p className="mt-3 text-xs text-m3-outline dark:text-m3-outline-dk">Last updated {LAST_UPDATED}</p>
              </motion.div>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {HIGHLIGHTS.map((h, i) => {
                  const Icon = h.icon;
                  return (
                    <motion.div
                      key={h.title}
                      className="p-4 rounded-[24px] bg-m3-primary-container/70 dark:bg-m3-primary-deep/40 flex items-start gap-3"
                      initial={{ opacity: 0, y: 18, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ ...spring, delay: 0.14 + i * 0.05 }}
                    >
                      <div className="w-10 h-10 rounded-2xl bg-m3-primary text-white dark:bg-m3-primary-light dark:text-m3-on-primary-deep flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-m3-on-primary-deep dark:text-m3-primary-container">
                          {h.title}
                        </p>
                        <p className="text-xs mt-0.5 leading-relaxed text-m3-on-primary-deep/80 dark:text-m3-primary-container/80">
                          {h.body}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Full policy */}
              <div className="space-y-6">
                {SECTIONS.map((section, i) => {
                  const Icon = section.icon;
                  return (
                    <motion.section
                      key={section.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring, delay: 0.3 + Math.min(i, 8) * 0.04 }}
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-[14px] bg-m3-surface-hi dark:bg-m3-d3 text-m3-primary dark:text-m3-primary-light flex items-center justify-center shrink-0">
                          <Icon className="w-[18px] h-[18px]" />
                        </div>
                        <h3 className="text-base font-semibold text-m3-on-surface dark:text-white">
                          {section.title}
                        </h3>
                      </div>
                      <div className="pl-12 text-sm leading-relaxed text-m3-variant dark:text-m3-variant-dk selectable-text">
                        {section.body}
                      </div>
                    </motion.section>
                  );
                })}
              </div>

              <div className="mt-10 flex items-center gap-2 text-xs text-m3-outline dark:text-m3-outline-dk">
                <MessageSquare className="w-4 h-4" />
                <span>Ping · Standard SMS</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
