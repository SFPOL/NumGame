// // main.js

import { Game } from "./game.js";
import { Board } from "./board.js";
import { makeElement } from "./ui_utils.js";

// === MAIN DOM SHELL SETUP ===

export const appShell = makeElement("div", { className: "appShell" });
export const gameShell = makeElement("div", { className: "gameShell" });

appShell.appendChild(gameShell);
document.body.appendChild(appShell);

// === VIEWPORT RESPONSIVENESS ===

function resizeApp() {
    const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    const baseWidth = 634;
    const baseHeight = 1050;

    const scaleWidth = viewportWidth / baseWidth;
    const scaleHeight = viewportHeight / baseHeight;

    if (scaleWidth < scaleHeight) {
        appShell.style.width = `${baseWidth}px`;
        appShell.style.height = `${viewportHeight / scaleWidth}px`;
        appShell.style.transform = `translate(-50%, 0) scale(${scaleWidth})`;
    } else {
        appShell.style.width = `${viewportWidth / scaleHeight}px`;
        appShell.style.height = `${baseHeight}px`;
        appShell.style.transform = `translate(-50%, 0) scale(${scaleHeight})`;
    }

}

// Update the scale whenever the screen size changes
window.addEventListener("resize", resizeApp);
window.addEventListener("orientationchange", resizeApp);
if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeApp);
    window.visualViewport.addEventListener("scroll", resizeApp);
}
resizeApp(); // Trigger immediately to set the initial layout

// === INITIALIZE GAME & WHITEBOARD ===

function initializeApp() {
    const game = new Game(gameShell, appShell);
    const board = new Board(appShell);
}

initializeApp();