import * as inputs from "@rcade/plugin-input-classic";

window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = {
    autoplay: "on",
    unmuteOverlay: "visible",
    maxExecutionDuration: 100,
};

const CALLBACKS = {};

function injectKeyDown(code, key) {
    CALLBACKS['keydown']({
        code,
        key,
        preventDefault() {
            console.log('preventDefault called on keydown event');
        }
    });
}

function injectKeyUp(code, key) {
    CALLBACKS['keyup']({
        code,
        key,
        preventDefault() {
            console.log('preventDefault called on keydown event');
        }
    });
}

const MAP = {

    // WASD + P, O, U
    "system-ONE_PLAYER": ["KeyU", "u"],
    "button-1-A": ["KeyP", "p"],
    "button-1-B": ["KeyO", "o"],
    "button-1-UP": ["KeyW", "w"],
    "button-1-DOWN": ["KeyS", "s"],
    "button-1-LEFT": ["KeyA", "a"],
    "button-1-RIGHT": ["KeyD", "d"],

    // arrow keys + Nm3, Nm2, Nm5
    "system-TWO_PLAYER": ["Numpad5", "5"],
    "button-2-A": ["Numpad3", "3"],
    "button-2-B": ["Numpad2", "2"],
    "button-2-UP": ["ArrowUp", "ArrowUp"],
    "button-2-DOWN": ["ArrowDown", "ArrowDown"],
    "button-2-LEFT": ["ArrowLeft", "ArrowLeft"],
    "button-2-RIGHT": ["ArrowRight", "ArrowRight"],
}

inputs.on("inputStart", input => {
    const [code, key] = MAP[input.type == "system" ? `system-${input.button}` : `button-${input.player}-${input.button}`] || [];

    if (code && key) {
        injectKeyDown(code, key);
    }
})

inputs.on("inputEnd", input => {
    const [code, key] = MAP[input.type == "system" ? `system-${input.button}` : `button-${input.player}-${input.button}`] || [];

    if (code && key) {
        injectKeyUp(code, key);
    }
})

async function loadSWF() {
    const container = document.getElementById('swf-container');

    try {
        const ruffle = window.RufflePlayer.newest();
        const player = ruffle.createPlayer();

        player.style.width = "336px";
        player.style.height = "262px";

        container.appendChild(player);

        await player.load('/SSF2Portable.swf');
    } catch (error) {
        console.error('Error loading SWF:', error);
    }
}

window.addEventListener('load', loadSWF);

window.patcher = {
    addEventListener(type, listener, options) {
        console.log(`Patched addEventListener called with type: ${type}`);

        CALLBACKS[type] = listener;

        return window.realAddEventListener(type, listener, options);
    }
}