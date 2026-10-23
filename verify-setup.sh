#!/usr/bin/env bash
# Run from the repo root (the folder that contains package.json) after unzipping Ping-setup-update.zip.
ok=0; bad=0
check() { # description, file, pattern
  if [ -f "$2" ] && grep -q -- "$3" "$2"; then echo "OK   $1"; ok=$((ok+1)); else echo "MISS $1  ($2)"; bad=$((bad+1)); fi
}
check "setup flow component"        src/components/OnboardingFlow.tsx "OnboardingScreen"
check "theme picker component"      src/components/ThemePicker.tsx "role=\"radiogroup\""
check "setup flag helper"           src/utils/setupFlag.ts "ping_setup_done_v1"
check "pre-paint theme script"      index.html "gm_sms_settings_v2"
check "Latest card inset (mx-4)"    src/components/LatestMessageCard.tsx "mx-4 mb-3"
check "overlay-scroll CSS"          src/index.css "scrollbar-width: none"
check "bridge: setup status"        src/services/smsBridge.ts "getSetupStatus"
check "plugin: setup status"        android/app/src/main/java/com/ping/sms/PingSmsPlugin.java "getSetupStatus"
check "plugin: open app settings"   android/app/src/main/java/com/ping/sms/PingSmsPlugin.java "ACTION_APPLICATION_DETAILS_SETTINGS"
check "App.tsx wires the flow"      src/App.tsx "OnboardingFlow"
check "Settings: setup guide"       src/components/SettingsModal.tsx "onOpenSetup"
check "Settings: theme picker"      src/components/SettingsModal.tsx "<ThemePicker />"
# your own earlier fixes must still be there
check "kept: lazyScreen typing"     src/App.tsx "function lazyScreen<T extends React.ComponentType<any>>"
check "kept: addListener overloads" src/services/smsBridge.ts "eventName: 'appResumed'"
echo; echo "$ok ok, $bad missing"; [ "$bad" -eq 0 ]
