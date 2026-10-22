import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, springBouncy, fadeFast, useIsDesktop } from '../motion.ts';
import { Search, X, UserPlus, Phone, ArrowRight, RefreshCw } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { getInitials } from '../utils/smsUtils.ts';
import { searchContacts } from '../utils/contactSearch.ts';
import { AvatarCircle } from './AvatarCircle.tsx';
import { smsBridge } from '../services/smsBridge.ts';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const isDesktop = useIsDesktop();
  const searchInputRef = useRef<HTMLInputElement>(null);
  // raise the keyboard once the panel has finished sliding in, so the two never compete for frames
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      smsBridge.showKeyboard();
    }, 360);
    return () => window.clearTimeout(timer);
  }, [isOpen]);
  const {
    contacts,
    startNewConversation,
    importWebContact,
    syncDeviceContacts,
    isSyncingDevice,
    getContactPhoto,
  } = useSMS();
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(40);
  useEffect(() => {
    setShown(40);
  }, [query, isOpen]);


  // Search runs on a slightly delayed copy of what you type, so typing itself never stutters
  const deferredQuery = useDeferredValue(query);
  const filteredContacts = useMemo(() => searchContacts(contacts, deferredQuery), [contacts, deferredQuery]);

  const isNumericQuery = /^[\d\s+\-().]+$/.test(query.trim()) && query.trim().length >= 3;

  const handleSelectContact = (name: string, phoneNumber: string) => {
    startNewConversation({ name, phoneNumber });
    onClose();
  };

  const handleDirectNumber = () => {
    if (!query.trim()) return;
    startNewConversation({ phoneNumber: query.trim() });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      key="overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fadeFast}
      />

      {/* Sheet / Modal */}
      <motion.div
        className="will-change-transform relative w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] bg-m3-surface dark:bg-m3-d0 sm:rounded-3xl border border-m3-line dark:border-m3-d4 shadow-2xl flex flex-col z-50 overflow-hidden"
        initial={isDesktop ? { opacity: 0, y: 56, scale: 0.97 } : { y: '100%' }} animate={isDesktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }} exit={isDesktop ? { opacity: 0, y: 36, scale: 0.98 } : { y: '100%' }} transition={spring}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-m3-line dark:border-m3-d4 bg-white dark:bg-m3-d1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-m3-on-surface dark:text-white">
              New conversation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-m3-variant dark:text-m3-variant-dk hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input field */}
        <div className="p-4 bg-white dark:bg-m3-d1 border-b border-m3-line dark:border-m3-d4">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-full bg-m3-surface-hi dark:bg-m3-d3 text-sm">
            <span className="text-xs font-semibold text-m3-outline dark:text-m3-outline-dk">To:</span>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name or phone number"
              className="w-full bg-transparent text-m3-on-surface dark:text-m3-on-surface-dk placeholder-m3-outline dark:placeholder-m3-outline-dk outline-none text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-m3-outline hover:text-m3-on-surface dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Direct SMS Option if typed number */}
          {isNumericQuery && (
            <button
              type="button"
              onClick={handleDirectNumber}
              className="w-full flex items-center justify-between p-3.5 bg-m3-primary-container/50 dark:bg-m3-primary-deep/30 hover:bg-m3-primary-container dark:hover:bg-m3-primary-deep rounded-2xl transition-colors mb-2 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-m3-primary text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-m3-primary dark:text-m3-primary-light">
                    Send to {query}
                  </p>
                  <p className="text-xs text-m3-outline dark:text-m3-outline-dk">Standard SMS text</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-m3-primary dark:text-m3-primary-light" />
            </button>
          )}

          {/* Device Contacts Quick Actions */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <button
              type="button"
              onClick={async () => {
                const picked = await importWebContact();
                if (picked) {
                  handleSelectContact(picked.name, picked.phoneNumber);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-m3-surface-hi dark:bg-m3-d2 hover:bg-m3-primary-container/60 dark:hover:bg-m3-d4 text-m3-primary dark:text-m3-primary-light rounded-full text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Choose from Device</span>
            </button>

            <button
              type="button"
              onClick={() => syncDeviceContacts()}
              disabled={isSyncingDevice}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-m3-d1 border border-m3-line dark:border-m3-d4 hover:bg-black/5 dark:hover:bg-white/10 text-m3-variant dark:text-m3-variant-dk rounded-full text-xs font-medium transition-colors"
              title="Sync phone contacts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDevice ? 'animate-spin' : ''}`} />
              <span>{isSyncingDevice ? 'Syncing...' : 'Sync Contacts'}</span>
            </button>
          </div>

          <div className="px-3 py-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-m3-outline dark:text-m3-outline-dk">
            <span>Contacts ({filteredContacts.length})</span>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-medium text-m3-on-surface dark:text-m3-on-surface-dk">
                No contacts found
              </p>
              <p className="text-xs text-m3-outline dark:text-m3-outline-dk mt-1">
                Type a full phone number above to start a standard SMS conversation.
              </p>
            </div>
          ) : (
            <>
            {filteredContacts.slice(0, shown).map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelectContact(contact.name, contact.phoneNumber)}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-m3-surface-hi dark:hover:bg-m3-d2 transition-colors text-left"
              >
                <AvatarCircle
                  photo={getContactPhoto(contact.phoneNumber)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm ${contact.avatarColor} text-white shadow-xs shrink-0`}
                >
                  {contact.initials}
                </AvatarCircle>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-m3-on-surface dark:text-white truncate">
                    {contact.name}
                  </p>
                  <p className="text-xs text-m3-outline dark:text-m3-outline-dk font-mono truncate">
                    {contact.phoneNumber}
                  </p>
                </div>
              </button>
            ))}
            {filteredContacts.length > shown && (
              <button
                type="button"
                onClick={() => setShown((n) => n + 100)}
                className="w-full py-3 rounded-2xl text-xs font-semibold text-m3-primary dark:text-m3-primary-light hover:bg-m3-surface-hi dark:hover:bg-m3-d2"
              >
                Show {Math.min(100, filteredContacts.length - shown)} more contacts
              </button>
            )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};
