import * as inputs from "@rcade/plugin-input-classic";

// Global reference to the player so we can focus it later
let ruffleInstance = null;

window.RufflePlayer = window.RufflePlayer || {};
window.RufflePlayer.config = {
    autoplay: "on",
    unmuteOverlay: "visible",
    maxExecutionDuration: 100,
};

// --- KEY MAP (Your exact requested format) ---
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
    // 1. Find the target (The Ruffle Player)
    const target = ruffleInstance || document.querySelector('ruffle-player') || document.body;

    // 2. FORCE FOCUS: Flash ignores inputs if not focused
    if (document.activeElement !== target) {
        target.focus(); 
    }

    // 3. AUTO-CALCULATE LOCATION
    // If the code contains "Numpad", we MUST send location 3, or Flash ignores it.
    const location = code.includes("Numpad") ? 3 : 0;

    console.log(`Injecting ${type} -> ${code} (Key: ${keyCode}, Loc: ${location})`);

    const event = new KeyboardEvent(type, {
        key: key,
        code: code,
        keyCode: keyCode, 
        which: keyCode,
        location: location, // Automatically applied based on code name
        bubbles: true,
        cancelable: true,
        composed: true,     // crucial for shadow DOM (which Ruffle uses)
        view: window
    });

    target.dispatchEvent(event);
}

inputs.on("inputStart", input => {
    const mapKey = input.type == "system" 
        ? `system-${input.button}` 
        : `button-${input.player}-${input.button}`;
    
    const [code, key, keyCode] = MAP[mapKey] || [];
    if (code) injectEvent('keydown', code, key, keyCode);
})

inputs.on("inputEnd", input => {
    const mapKey = input.type == "system" 
        ? `system-${input.button}` 
        : `button-${input.player}-${input.button}`;

    const [code, key, keyCode] = MAP[mapKey] || [];
    if (code) injectEvent('keyup', code, key, keyCode);
})

// --- LOADING ---
async function loadSWF() {
    const container = document.getElementById('swf-container');
    try {
        const ruffle = window.RufflePlayer.newest();
        const player = ruffle.createPlayer();
        
        // Save global reference for the injector
        ruffleInstance = player; 

        player.id = "ruffle_target";
        player.style.width = "336px";
        player.style.height = "262px";
        
        // Make sure it can accept focus
        player.tabIndex = 0; 

        container.appendChild(player);
        await player.load('/SSF2Portable.swf');
        
        console.log("SWF Loaded. Clicking player to ensure focus...");
        player.focus();
        player.click(); // sometimes needed to "wake up" the audio context/input
        
    } catch (error) {
        console.error('Error loading SWF:', error);
    }
}

window.addEventListener('load', loadSWF);
