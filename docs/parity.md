# Parity tracker

Status: **not started** / **built** (compiles, not compared) / **verified** (compared with the screenshot or measured on the phone).
Nothing is "verified" in Phase 1: no screen of the native app has been run on the phone yet.

| Screen / component | Old source | Native | Status | Notes |
|---|---|---|---|---|
| Theme: System/Light/Dark + Material You | `dynamicColor.ts`, `ThemePicker.tsx` | `theme/` | built | Colour maths proven by golden tests; visual check on phone pending |
| Fonts | `index.css:85` | `PingFonts` | built | Same stack, system font (One Sans on the user's phone); device-checked with the Font check screen |
| Icons (69 lucide) | lucide-react 0.546 | `ui/icons` | built | Generated from the same SVG data |
| Avatar circle + colour hash | `AvatarCircle.tsx`, `smsUtils.ts` | `AvatarCircle` | built | Hash/initials golden-tested (236 + 9 cases); matches screenshots (AX purple, JD orange, VM brown, JA indigo) |
| Skeleton + top progress | `Skeleton.tsx` | `Skeleton.kt` | built | |
| Press feedback | `index.css:104` | `PressFeedback.kt` | built | |
| Shadows | Tailwind | `CssShadow.kt` | built | blur->radius mapping unverified |
| Bottom tabs (sliding pill, badges) | `BottomTabs.tsx` | `BottomTabs.kt` | built | Glow = glass blur (see design-tokens 7) |
| Collapsing top bar + logo | `TopSearchBar.tsx`, `.topbar-*` | `TopBar.kt` | built | Real search input + profile menu in Phase 3 |
| Bar collapse thresholds | `ConversationList.tsx:258` | `BarCollapse.kt` | built | |
| Sheet scaffold | `ConversationActionSheet.tsx:178` | `Sheet.kt` | built | Predictive back in Phase 3 |
| Glass bars (blur, tint, saturate, rim) | `index.css:344` | `Glass.kt` | built | **Frame-time check on phone required** |
| Edge fade / blur strip | `InboxColumn.tsx` | | not started | Phase 3 |
| Onboarding | `OnboardingFlow.tsx` | | not started | Phase 3 |
| Inbox: latest card, list, FAB, history | | | not started | Phase 3 |
| Chat view | `ChatView.tsx` | | not started | Phase 3 |
| Search, new chat, all action sheets | | | not started | Phase 3 |
| Settings (all sections) | `SettingsModal.tsx` | | not started | Phase 3, screenshots settings-01..08 |
| Profile menu | `TopSearchBar.tsx:182` | | not started | Phase 3 |
| Tablet two/three-pane | `App.tsx` | | not started | Phase 3 |
