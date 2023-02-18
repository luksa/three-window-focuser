const { Clutter, Meta, Shell } = imports.gi;


const keyBindings = new Map([
    ['focus-left-window', () => { focusLeftWindow(); }],
    ['center-left-window', () => { centerLeftWindow(); }],
    ['focus-right-window', () => { focusRightWindow(); }],
    ['center-right-window', () => { centerRightWindow(); }],
    ['focus-center-window', () => { focusCenterWindow(); }],
]);

const settings = imports.misc.extensionUtils.getSettings();
const Main = imports.ui.main;
const Gdk = imports.gi.Gdk;
const Screen = Gdk.Screen;

function init() {
}

function enable() {
    bind(keyBindings);
}

function disable() {
    unbind(keyBindings);
}

function bind(keyBindings) {
    log("Binding keys");
    keyBindings.forEach((callback, key) => {
        log(`binding key ${key}`);
        //const key = keyString as KeyBindingSettingName;
        if (Main.wm.addKeybinding && Shell.ActionMode) { // introduced in 3.16
            Main.wm.addKeybinding(key, settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, callback);
        }
        else if (Main.wm.addKeybinding && Shell.KeyBindingMode) { // introduced in 3.7.5
            Main.wm.addKeybinding(key, settings, Meta.KeyBindingFlags.NONE, Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.MESSAGE_TRAY, callback);
        }
        else {
            global.display.add_keybinding(key, settings, Meta.KeyBindingFlags.NONE, callback);
        }
    });
}

function unbind(keyBindings) {
    log("Unbinding keys");
    for (let key of keyBindings.keys()) {
        if (Main.wm.removeKeybinding) { // introduced in 3.7.2
            Main.wm.removeKeybinding(key);
        }
        else {
            global.display.remove_keybinding(key);
        }
    }
}

function focusLeftWindow() {
    const screenWidth = getScreenWidth();
    const topScreenHeight = getTopScreenHeight();
    focusTopMostWindowInRectangle(0, 0, screenWidth / 3, topScreenHeight);
}

function focusRightWindow() {
    const screenWidth = getScreenWidth();
    const topScreenHeight = getTopScreenHeight();
    focusTopMostWindowInRectangle(screenWidth * 2 / 3, 0, screenWidth, topScreenHeight);
}

function focusCenterWindow() {
    const screenWidth = getScreenWidth();
    const topScreenHeight = getTopScreenHeight();
    focusTopMostWindowInRectangle(screenWidth / 3, 0, screenWidth * 2 / 3, topScreenHeight);
}

function centerLeftWindow() {
    const screenWidth = getScreenWidth();
    const topScreenHeight = getTopScreenHeight();
    centerTopMostWindowInRectangle(0, 0, screenWidth / 3, topScreenHeight, screenWidth / 3);
}

function centerRightWindow() {
    const screenWidth = getScreenWidth();
    const topScreenHeight = getTopScreenHeight();
    centerTopMostWindowInRectangle(screenWidth * 2 / 3, 0, screenWidth, topScreenHeight, -screenWidth / 3);
}


// find the top most window in the given rectangle and focuses it
function focusTopMostWindowInRectangle(x1, y1, x2, y2) {
    const otherWindow = getTopMostWindow(x1, y1, x2, y2);
    if (otherWindow != null) {
        focusWindow(otherWindow);
    }
}

// find the top most window in the given rectangle, moves it by deltaX, while
// also moving the top most window in the screen center by -deltaX
function centerTopMostWindowInRectangle(x1, y1, x2, y2, deltaX) {
    const screenWidth = getScreenWidth();
    const topScreenHeight = 1440;
    const focusedWindow = getTopMostWindow(screenWidth / 3, 0, screenWidth * 2 / 3, topScreenHeight);
    const otherWindow = getTopMostWindow(x1, y1, x2, y2);

    if (otherWindow == null) {
        return;
    }

    if (focusedWindow != null) {
        const focusedFrame = focusedWindow.get_frame_rect();
        focusedWindow.move_resize_frame(true, focusedFrame.x - deltaX, focusedFrame.y, focusedFrame.width, focusedFrame.height);
    }

    const otherFrame = otherWindow.get_frame_rect();
    otherWindow.move_resize_frame(true, otherFrame.x + deltaX, otherFrame.y, otherFrame.width, otherFrame.height);
    focusWindow(otherWindow);
}


function getTopMostWindow(x1, y1, x2, y2) {
    let topMostWindow = null;
    let windows = getWindows();
    for (let i = 0; i < windows.length; i++) {
        const window = windows[i];
        const frame = window.get_frame_rect()
        const windowX1 = frame.x;
        const windowY1 = frame.y;
        const windowX2 = windowX1 + frame.width;
        const windowY2 = windowY1 + frame.height;

        if ((x1 <= windowX1 && windowX1 < x2 || x1 < windowX2 && windowX2 <= x2) &&
            (y1 <= windowY1 && windowY1 < y2 || y1 < windowY2 && windowY2 <= y2) &&
            (topMostWindow === null || window.get_layer() > topMostWindow.get_layer())) {
            topMostWindow = window;
        }
    }
    return topMostWindow;
}


function focusWindow(window) {
    window.activate(global.get_current_time());
    Main.activateWindow(window);
}

function getScreenWidth() {
    return Screen.get_default().get_width();
}

function getScreenHeight() {
    return Screen.get_default().get_height();
}

function getTopScreenHeight() {
    return 1440; // TODO
}

function getWindows() {
    return global.workspace_manager.get_active_workspace().list_windows();
}

