#!/bin/zsh
# Compila e instala o Gabarita para Mac em ~/Applications/Gabarita.app.
# Na primeira vez, guarda o app nativo antigo (Swift/SQLite) como "Gabarita Clássico.app".
set -euo pipefail
cd "$(dirname "$0")"
APP=~/Applications/Gabarita.app
OLD=~/Applications/"Gabarita Clássico.app"
swift build -c release
if [ -d "$APP" ] && [ ! -d "$OLD" ] && ! /usr/libexec/PlistBuddy -c "Print :GabaritaWeb" "$APP/Contents/Info.plist" >/dev/null 2>&1; then
  mv "$APP" "$OLD"
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Gabarita Clássico" -c "Set :CFBundleName Gabarita Clássico" \
    -c "Set :CFBundleIdentifier com.matheuscastro.gabarita.classico" "$OLD/Contents/Info.plist"
  codesign --force -s - "$OLD"
fi
ICON=""
[ -f "$OLD/Contents/Resources/Gabarita.icns" ] && ICON="$OLD/Contents/Resources/Gabarita.icns"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp .build/release/Gabarita "$APP/Contents/MacOS/Gabarita"
[ -n "$ICON" ] && cp "$ICON" "$APP/Contents/Resources/Gabarita.icns"
cat > "$APP/Contents/Info.plist" <<P
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Gabarita</string>
  <key>CFBundleDisplayName</key><string>Gabarita</string>
  <key>CFBundleExecutable</key><string>Gabarita</string>
  <key>CFBundleIconFile</key><string>Gabarita</string>
  <key>CFBundleIdentifier</key><string>com.matheuscastro.gabarita</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>2.0</string>
  <key>CFBundleVersion</key><string>2.0</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSMicrophoneUsageDescription</key><string>Para ditar perguntas ao tutor.</string>
  <key>NSAppTransportSecurity</key><dict><key>NSAllowsArbitraryLoads</key><false/></dict>
  <key>GabaritaWeb</key><true/>
</dict></plist>
P
codesign --force -s - "$APP"
echo "Instalado: $APP"
