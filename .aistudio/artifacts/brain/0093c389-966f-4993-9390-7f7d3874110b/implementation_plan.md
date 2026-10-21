# Google Messages SMS - Material Design 3

A clean, polished standard SMS messaging application inspired by Google Messages, crafted strictly according to Material Design 3 (Material You) guidelines. Focuses on an uncluttered, distraction-free text messaging experience without MMS or RCS bloat, featuring dynamic blue tonal styling, pinned conversations, scheduled sending, starred messages, search, and full archive/conversation management.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed during Phase 1:
> - **Theme & Visual Tone**: Google Messages Dynamic Blue palette with fluid Light / Dark mode toggle and authentic Material 3 elevation, surfaces, and typography.
> - **Media Scope**: Pure standard SMS text messaging (no MMS or RCS dependencies), focusing on message clarity, character/segment counters, delivery reports, and clean message bubbles.
> - **Feature Suite**: Full feature suite enabled, including real-time search, pinned conversations, scheduled message send, starred message bookmarking, and archive/unarchive folder management.

- **Confirmed Decision 1**: Clean standard text SMS only (no MMS payload complexity), with character counters (160-char SMS segment calculation) and delivery status indicators (Sent, Delivered).
- **Confirmed Decision 2**: Responsive dual-mode viewport supporting both native mobile touch navigation and adaptive desktop two-pane layout with optional Pixel phone frame preview.
- **Confirmed Decision 3**: Local storage persistence with initial realistic SMS threads (contacts, verification codes, personal notes) and an interactive simulated incoming SMS engine.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a lightweight, responsive standard SMS messaging interface that faithfully recreates the Google Messages experience. Users can start conversations with contacts or custom numbers, send and schedule standard SMS texts, pin essential chats, star memorable messages, search message history instantly, swipe or tap to archive, and manage blocked numbers.
- **Target Audience / Persona**: Users who want the clean, thoughtful ergonomics of Google Messages and Material You for standard text communication, free from unwanted RCS prompts or heavy MMS overhead.
- **Key Value**: Crisp typographic hierarchy, fluid Material 3 motion, thumb-friendly ergonomic controls, and practical SMS productivity tools (scheduled send, starred messages, fast search).

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Inbox & Thread Browsing**:
   - Material 3 search bar at the top with user profile avatar, unread filter, and quick navigation drawer/menu (All, Starred, Archived, Blocked).
   - Pinned conversation row/header keeping top contacts readily accessible.
   - Conversation list items displaying contact avatar with Material 3 tonal color generation, contact name, snippet, relative timestamp, unread badge, and pin indicator.
   - Swipe actions / long-press / contextual top bar selection for Archive, Delete, Pin/Unpin, and Mark Read/Unread.
2. **Conversation & SMS Composer**:
   - Sticky top app bar with contact name, phone number, call action, star filter, and overflow options (Details, Block, Delete thread).
   - Date separator chips and clean SMS text bubbles: outgoing messages in vibrant MD3 Primary Container (`#D3E3FD` light / `#004A77` dark) with dark/light text; incoming messages in Neutral Variant Surface Container (`#F0F4F9` light / `#1F2228` dark).
   - Delivery indicators (`Sent`, `Delivered`) and timestamp details on tap.
   - Text composer input with SMS character counter (e.g. `124/160`), Scheduled Send button (clock icon) for setting future send time, and animated Send button with haptic/sound feedback.
3. **Scheduled Send Workflow**:
   - Tap schedule icon or long-press send button to reveal MD3 Schedule bottom sheet / modal.
   - Choose quick presets ("Later today, 6:00 PM", "Tomorrow, 8:00 AM", or "Custom date & time").
   - Scheduled message renders in the chat thread with a distinct dashed/clock status chip, allowing the user to edit, send now, or cancel.
4. **Starred & Search Views**:
   - Instant search overlay matching contacts, phone numbers, and message bodies with highlighted terms.
   - Starred messages view aggregating all flagged messages across all conversations with direct 1-tap jump to context.
5. **Simulated SMS Delivery & Incoming Messages**:
   - Realistic test panel enabling users to simulate incoming SMS from existing or new numbers (e.g., automated 2FA code, quick reply).

### Visual Identity & Theme
- **Design System**: Material Design 3 (Material You)
- **Palette**:
  - Primary: `#0B57D0` (Google Blue 600)
  - Primary Container: `#D3E3FD` (Google Blue 100) / Dark: `#004A77`
  - On Primary Container: `#041E49` (Google Blue 900) / Dark: `#D3E3FD`
  - Surface Light: `#F8FAFD` / Surface Dark: `#111318`
  - Surface Container: `#EDF2FA` / Dark: `#1B1E24`
  - Surface Container High: `#E3E8F2` / Dark: `#272A30`
  - Text Primary: `#1F1F1F` / Dark: `#E2E2E2`
  - Text Secondary: `#444746` / Dark: `#C4C7C5`
- **Typography**: Google Sans / Plus Jakarta Sans style hierarchy with clean weights (Regular 400 for message bodies, Medium 500 for contacts and labels, SemiBold 600 for headings).
- **Shape & Surfaces**: Full Material 3 corner radius standards (`rounded-3xl` for search bar & floating buttons, `rounded-2xl` for message bubbles with directional asymmetric tail, `rounded-xl` for dialogs).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Viewport Architecture (Mobile Native + Desktop Split View)**
  - *Chosen Approach*: On small screens, provides native single-column phone navigation (Conversation List $\leftrightarrow$ Chat View). On tablet/desktop screens, expands into a sleek two-pane Google Messages web view, with a toggleable "Pixel Phone Preview Frame" so users can test on desktop as a simulated mobile device.
  - *Why*: Adheres to the mobile-touch guidelines while preventing desert-island viewport collapse on 1440px desktop screens.
- **Decision 2: LocalStorage SMS State Management & Offline First**
  - *Chosen Approach*: Pure client-side reactive store persisted in `localStorage` with pre-seeded rich conversations and real-time updates.
  - *Why*: Instantaneous response, zero latency, completely private, and works without external server or database provisioning requirements.
- **Decision 3: GSM-7 & SMS Segment Character Counter**
  - *Chosen Approach*: Live SMS character indicator that computes segment counts (standard 160 characters for single segment, 153 characters for concatenated multi-part SMS).
  - *Why*: Elevates the authentic standard SMS utility experience without needing MMS payload data.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Google Messages App                        │
│             (ThemeContext: Dynamic Blue / Dark Mode)          │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼───────────────┐
│     Conversations View      │ │       Chat Thread View       │
│  ┌───────────────────────┐  │ │  ┌────────────────────────┐  │
│  │ MD3 Search & Header   │  │ │  │ Thread Header & Actions│  │
│  ├───────────────────────┤  │ │  ├────────────────────────┤  │
│  │ Pinned Chats Row      │  │ │  │ Message Feed & Bubbles │  │
│  ├───────────────────────┤  │ │  │ - Delivery Statuses    │  │
│  │ Filter Tabs / Drawer  │  │ │  │ - Star Toggle          │  │
│  │ (All, Starred, Arch.) │  │ │  │ - Scheduled SMS Cards  │  │
│  ├───────────────────────┤  │ │  ├────────────────────────┤  │
│  │ Thread List Items     │  │ │  │ SMS Composer & Counter │  │
│  │ - Swipe to Archive    │  │ │  │ - Schedule Sheet Modal │  │
│  │ - Multi-select bar    │  │ │  │ - Fast Send / Haptic   │  │
│  ├───────────────────────┤  │ │  └────────────────────────┘  │
│  │ Extended "Start Chat" │  │ │                              │
│  │ Floating Action Button│  │ │                              │
│  └───────────────────────┘  │ │                              │
└──────────────┬──────────────┘ └──────────────┬───────────────┘
               │                               │
┌──────────────▼───────────────────────────────▼───────────────┐
│                    SMS Engine & Storage                      │
│  - Contacts Store & Seed Data (Mom, Bank, Sarah, Alex...)    │
│  - Messages Store (Threads, Starred, Archived, Blocked)      │
│  - Scheduled SMS Dispatch Timer (Tick every 5s)              │
│  - Incoming SMS Simulator (Auto-response & Custom trigger)   │
│  - LocalStorage Serialization & Hydration                    │
└──────────────────────────────────────────────────────────────┘
```

### Data Entities
- **Conversation**: `id`, `contactId`, `contactName`, `phoneNumber`, `avatarColor`, `pinned`, `archived`, `blocked`, `unreadCount`, `lastUpdated`.
- **Message**: `id`, `conversationId`, `sender` (`'me'` | `'them'`), `text`, `timestamp`, `status` (`'sending'` | `'sent'` | `'delivered'`), `isStarred`, `isScheduled`, `scheduledTime`.
- **Contact**: `id`, `name`, `phoneNumber`, `avatarColor`, `initials`.

---

## Planned Implementation Steps

1. **Configure Metadata & HTML Entry**: Update `metadata.json` and `index.html` with accurate branding ("Google Messages - SMS").
2. **State & Storage Infrastructure**: Create `types.ts`, `smsStore.ts`, and initial realistic SMS thread data with `localStorage` persistence and event pub/sub.
3. **Material 3 Theme & Layout Shell**: Build responsive root layout with dynamic blue palette, dark/light theme switcher, and optional mobile device frame toggle.
4. **Conversations List & Header Components**: Implement Material 3 top search bar, account switcher menu, navigation drawer (All, Starred, Archived, Blocked), pinned chats carousel, conversation list rows with swipe actions, and Start Chat FAB.
5. **Chat View & SMS Composer**: Build authentic conversation thread, message bubbles with MD3 tonal surfaces, delivery stamps, star bookmark button, and character counter.
6. **Scheduled Send Engine**: Build MD3 bottom sheet / dialog for scheduling SMS, scheduled chips in chat, cancel/edit actions, and timer dispatcher.
7. **Simulation & Polish**: Add simulated incoming SMS triggers, sound effects (optional web audio chirp), contact picker modal, and verify full build with `compile_applet`.
