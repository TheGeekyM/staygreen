# Stay Active

A tiny cross-platform tray app that keeps Microsoft Teams, Slack and other apps from marking you **Away**.

Every 30–60 seconds (random, configurable) it presses one harmless key: Shift on macOS and Linux, F15 on Windows. That resets the OS idle timer these apps watch. While it's on, it also stops the display from sleeping.

Closing the window keeps it running in the system tray. Quit from the tray menu.

The window also shows a small **Team · demo** list. Those names are sample data for looks only, not real people or real presence status. Only the "You" row reflects the app's state.

Inspired by [sleekhost/stay-active](https://github.com/sleekhost/stay-active), a macOS shell script, rebuilt as a small Electron GUI for macOS, Windows and Linux.

## Download

Get the latest build from [Releases](https://github.com/TheGeekyM/stay-active-gui/releases/latest):

| OS | File |
|----|------|
| macOS (Apple Silicon) | `Stay-Active-x.y.z-arm64.dmg` |
| Windows | `Stay-Active-Setup-x.y.z.exe` (installer) or `Stay-Active-x.y.z.exe` (portable) |
| Linux | `Stay-Active-x.y.z.AppImage` |

### First-run notes

- **macOS:** the app is unsigned. If macOS says it is "damaged", run `xattr -cr "/Applications/Stay Active.app"`. Then allow it under **System Settings → Privacy & Security → Accessibility**, or it can't press keys. The app shows an error if permission is missing.
- **Windows:** SmartScreen may warn on first launch. Click **More info → Run anyway**.
- **Linux:** needs `xdotool` (`sudo apt install xdotool`) and an X11 session. Wayland is not supported. Run `chmod +x *.AppImage` first. Run it as your normal user, not root or sudo: as root the window comes up empty, so the app now refuses and says why.

## Run from source

```bash
npm install
npm start
```

The **System idle** counter in the window should drop to 0 after each keypress. If it doesn't, the keypress isn't registering on your system.

## Release

Push a `v*` tag. GitHub Actions builds for all three OSes and attaches the files to a GitHub Release.

```bash
npm version patch && git push --follow-tags
```

## License

MIT
