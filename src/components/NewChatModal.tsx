import React, { useState } from 'react';
import { Search, X, UserPlus, Phone, ArrowRight, RefreshCw } from 'lucide-react';
import { useSMS } from '../context/SMSContext.tsx';
import { getInitials } from '../utils/smsUtils.ts';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const {
    contacts,
    startNewConversation,
    importWebContact,
    syncDeviceContacts,
    isSyncingDevice,
  } = useSMS();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q);
  });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] bg-[#F8FAFD] dark:bg-[#111318] sm:rounded-3xl border border-[#E0E2EC] dark:border-[#2D3139] shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#E0E2EC] dark:border-[#2D3139] bg-white dark:bg-[#1A1D23]">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-[#1F1F1F] dark:text-white">
              New conversation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#444746] dark:text-[#C4C7C5] hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input field */}
        <div className="p-4 bg-white dark:bg-[#1A1D23] border-b border-[#E0E2EC] dark:border-[#2D3139]">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-full bg-[#EDF2FA] dark:bg-[#252A32] text-sm">
            <span className="text-xs font-semibold text-[#747775] dark:text-[#8E918F]">To:</span>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name or phone number"
              className="w-full bg-transparent text-[#1F1F1F] dark:text-[#E2E2E2] placeholder-[#747775] dark:placeholder-[#8E918F] outline-none text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white"
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
              className="w-full flex items-center justify-between p-3.5 bg-[#D3E3FD]/50 dark:bg-[#004A77]/30 hover:bg-[#D3E3FD] dark:hover:bg-[#004A77] rounded-2xl transition-colors mb-2 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0B57D0] text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0B57D0] dark:text-[#A8C7FA]">
                    Send to {query}
                  </p>
                  <p className="text-xs text-[#747775] dark:text-[#8E918F]">Standard SMS text</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA]" />
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#EDF2FA] dark:bg-[#1E2228] hover:bg-[#D3E3FD]/60 dark:hover:bg-[#2A303C] text-[#0B57D0] dark:text-[#A8C7FA] rounded-full text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Choose from Device</span>
            </button>

            <button
              type="button"
              onClick={() => syncDeviceContacts()}
              disabled={isSyncingDevice}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-[#1A1D23] border border-[#E0E2EC] dark:border-[#2D3139] hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-[#C4C7C5] rounded-full text-xs font-medium transition-colors"
              title="Sync phone contacts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDevice ? 'animate-spin' : ''}`} />
              <span>{isSyncingDevice ? 'Syncing...' : 'Sync Contacts'}</span>
            </button>
          </div>

          <div className="px-3 py-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#747775] dark:text-[#8E918F]">
            <span>Contacts ({filteredContacts.length})</span>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
                No contacts found
              </p>
              <p className="text-xs text-[#747775] dark:text-[#8E918F] mt-1">
                Type a full phone number above to start a standard SMS conversation.
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelectContact(contact.name, contact.phoneNumber)}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-[#EDF2FA] dark:hover:bg-[#1E2228] transition-colors text-left"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm ${contact.avatarColor} text-white shadow-xs shrink-0`}
                >
                  {contact.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1F1F1F] dark:text-white truncate">
                    {contact.name}
                  </p>
                  <p className="text-xs text-[#747775] dark:text-[#8E918F] font-mono truncate">
                    {contact.phoneNumber}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
