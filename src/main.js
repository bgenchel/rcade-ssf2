import * as inputs from "@rcade/plugin-input-classic";

// Global reference to the player
let ruffleInstance = null;
// Track currently held system keys for the combo
const HELD_SYSTEM_KEYS = new Set();
let isPauseActive = false;
let isStartActive = false;

window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = {
    autoplay: "on",
    unmuteOverlay: "visible",
    maxExecutionDuration: 100,
};

// --- KEY MAP ---
const MAP = {
    // WASD + P, O, U
    "system-ONE_PLAYER": ["KeyU", "u", 85],
    "button-1-A": ["KeyP", "p", 80],
    "button-1-B": ["KeyO", "o", 79],
    "button-1-UP": ["KeyW", "w", 87],
    "button-1-DOWN": ["KeyS", "s", 83],
    "button-1-LEFT": ["KeyA", "a", 65],
    "button-1-RIGHT": ["KeyD", "d", 68],

    // arrow keys + Nm3, Nm2, Nm5
    "system-TWO_PLAYER": ["Numpad5", "5", 101],
    "button-2-A": ["Numpad3", "3", 99],
    "button-2-B": ["Numpad2", "2", 98],
    "button-2-UP": ["ArrowUp", "ArrowUp", 38],
    "button-2-DOWN": ["ArrowDown", "ArrowDown", 40],
    "button-2-LEFT": ["ArrowLeft", "ArrowLeft", 37],
    "button-2-RIGHT": ["ArrowRight", "ArrowRight", 39],
}

// --- INJECTION LOGIC ---
function injectEvent(type, code, key, keyCode) {
    const target = ruffleInstance || document.querySelector('ruffle-player') || document.body;

    if (document.activeElement !== target) {
        target.focus();
    }

    // Auto-calculate location (3 for Numpad, 0 for everything else)
    const location = code.includes("Numpad") ? 3 : 0;

    // console.log(`Injecting ${type} -> ${code} (Key: ${keyCode}, Loc: ${location})`);

    const event = new KeyboardEvent(type, {
        key: key,
        code: code,
        keyCode: keyCode,
        which: keyCode,
        location: location,
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window
    });

    target.dispatchEvent(event);
}

// --- INPUT HANDLERS ---
inputs.on("inputStart", input => {
    const mapKey = input.type == "system"
        ? `system-${input.button}`
        : `button-${input.player}-${input.button}`;

    // 1. CHECK FOR COMBO (Start Logic)
    if (["system-ONE_PLAYER", "system-TWO_PLAYER", "button-1-A", "button-1-B", "button-2-A", "button-2-B"].includes(mapKey)) {
        HELD_SYSTEM_KEYS.add(mapKey);

        // If both keys are in the Set, Trigger Backspace!
        if (HELD_SYSTEM_KEYS.has("system-ONE_PLAYER") && HELD_SYSTEM_KEYS.has("system-TWO_PLAYER")) {
            if (!isStartActive) {
                console.log("Combo Activated: Simulating Space");
                injectEvent('keydown', "Space", " ", 32);
                isStartActive = true;
            }
        }

        if ((HELD_SYSTEM_KEYS.has("button-1-A") && HELD_SYSTEM_KEYS.has("button-1-B")) || (HELD_SYSTEM_KEYS.has("button-2-A") && HELD_SYSTEM_KEYS.has("button-2-B"))) {
            if (!isPauseActive) {
                console.log("Combo Activated: Simulating Backspace");
                injectEvent('keydown', "Backspace", "Backspace", 8);
                isPauseActive = true;
            }
        }
    }

    // 2. Standard Injection
    const [code, key, keyCode] = MAP[mapKey] || [];
    if (code) injectEvent('keydown', code, key, keyCode);
})

inputs.on("inputEnd", input => {
    const mapKey = input.type == "system"
        ? `system-${input.button}`
        : `button-${input.player}-${input.button}`;

    // 1. CHECK FOR START (End Logic)
    if ("system-ONE_PLAYER" === mapKey || "system-TWO_PLAYER" === mapKey) {
        HELD_SYSTEM_KEYS.delete(mapKey);

        // If the combo was active, release Backspace
        if (isStartActive) {
            console.log("Combo Deactivated: Releasing Space");
            injectEvent('keyup', "Space", " ", 32);
            isStartActive = false;
        }
    }

    if (["button-1-A", "button-1-B"].includes(mapKey) || ["button-2-A", "button-2-B"].includes(mapKey)) {
        HELD_SYSTEM_KEYS.delete(mapKey);

        // If the combo was active, release Backspace
        if (isPauseActive) {
            console.log("Combo Deactivated: Releasing Backspace");
            injectEvent('keyup', "Backspace", "Backspace", 8);
            isPauseActive = false;
        }
    }

    // 2. Standard Injection
    const [code, key, keyCode] = MAP[mapKey] || [];
    if (code) injectEvent('keyup', code, key, keyCode);
})

// --- LOADING ---
async function loadSWF() {
    const container = document.getElementById('swf-container');
    try {
        const ruffle = window.RufflePlayer.newest();
        const player = ruffle.createPlayer();

        ruffleInstance = player;

        player.id = "ruffle_target";
        player.style.width = "336px";
        player.style.height = "262px";
        player.tabIndex = 0;

        container.appendChild(player);
        await player.load('/SSF2Portable.swf');

        // Ensure focus
        player.focus();
        player.click();

    } catch (error) {
        console.error('Error loading SWF:', error);
    }
}

window.addEventListener('load', loadSWF);
