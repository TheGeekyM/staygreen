const { app, BrowserWindow, Menu, dialog, Tray, ipcMain, nativeImage, powerMonitor, powerSaveBlocker } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

// One harmless keypress per platform. Teams & co. watch OS input-idle time, so a real input event is needed.
// ponytail: keypress only, no mouse jiggle; a key event already resets idle time on every OS.
const PRESS = {
  darwin: ['osascript', ['-e', 'tell application "System Events" to key code 56']], // shift
  win32: ['powershell', ['-NoProfile', '-Command', "(New-Object -ComObject WScript.Shell).SendKeys('{F15}')"]],
  linux: ['xdotool', ['key', 'shift']], // X11 only
}[process.platform];

const HINT = {
  darwin: 'Grant Accessibility to Stay Active: System Settings → Privacy & Security → Accessibility',
  win32: 'PowerShell failed to send a key',
  linux: 'Install xdotool (sudo apt install xdotool); Wayland is not supported',
}[process.platform];

let win, tray, quitting = false, on = false, timer = null, blocker = null, count = 0;
let range = { min: 30, max: 60 };

const send = (msg) => win && !win.isDestroyed() && win.webContents.send('status', msg);

function tick() {
  execFile(PRESS[0], PRESS[1], (err) => {
    if (!on) return; // stopped while the keypress was in flight
    if (err) return stop(`Error: ${HINT}`);
    count++;
    const next = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    send({ running: true, count, last: Date.now(), next });
    updateTray();
    timer = setTimeout(tick, next * 1000);
  });
}

function start(r) {
  // Renderer is a trust boundary: clamp to sane integers.
  const min = Math.min(Math.max(parseInt(r?.min, 10) || 30, 5), 3600);
  const max = Math.min(Math.max(parseInt(r?.max, 10) || 60, min), 3600);
  range = { min, max };
  clearTimeout(timer);
  on = true;
  if (blocker === null) blocker = powerSaveBlocker.start('prevent-display-sleep');
  tick();
}

function stop(error) {
  on = false;
  clearTimeout(timer);
  timer = null;
  if (blocker !== null) powerSaveBlocker.stop(blocker), (blocker = null);
  send({ running: false, count, error });
  updateTray();
}

ipcMain.on('start', (_, r) => start(r));
ipcMain.on('stop', () => stop());
ipcMain.handle('idle', () => powerMonitor.getSystemIdleTime());

const show = () => (win.show(), win.focus());

function updateTray() {
  if (!tray) return;
  tray.setToolTip(on ? `Stay Active: on (${count} keypresses)` : 'Stay Active: off');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show window', click: show },
    { label: on ? 'Stop' : 'Start', click: () => (on ? stop() : start(range)) },
    { type: 'separator' },
    { label: 'Quit', click: () => ((quitting = true), app.quit()) },
  ]));
}

// Second launch just brings the running instance forward.
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => win && show());

app.whenReady().then(() => {
  // Chromium can't paint into a desktop session it doesn't own: as root the window comes up empty.
  if (process.platform === 'linux' && process.getuid() === 0) {
    const msg = 'Don\'t run Stay Active as root. Start it as your normal desktop user (no sudo).';
    console.error(msg);
    dialog.showErrorBox('Stay Active', msg);
    return app.exit(1);
  }
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
  tray = new Tray(icon.resize({ width: 18, height: 18 }));
  tray.on('click', show);
  updateTray();

  win = new BrowserWindow({
    width: 340, height: 340, useContentSize: true, resizable: false, autoHideMenuBar: true,
    title: 'Stay Active', backgroundColor: '#0f172a', icon,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile('index.html');
  // Closing the window keeps it running in the tray; quit from the tray menu.
  win.on('close', (e) => { if (!quitting) e.preventDefault(), win.hide(); });
});

app.on('before-quit', () => (quitting = true)); // Cmd+Q on macOS
app.on('activate', () => win && show()); // macOS dock click
