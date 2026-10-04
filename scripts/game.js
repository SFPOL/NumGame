// ============================================================================
//   GAME.JS - Game Lifecycle & Component Manager
// ============================================================================

import { GameLogic } from "./math_utils.js";
import { ExpressionBoxUI, OperationsBox, Confetti, initUIContext, makeElement, createElementCalculation } from "./ui_utils.js";

export class Game {

constructor(gameShell, appShell) {
        this.gameShell = gameShell;
        this.appShell = appShell;
        this.expressionBoxes = [];
        this.logic = new GameLogic();

        // Pass the creation method as a bound callback
        this.operationsBox = new OperationsBox(240, 300, "SUM", this.gameShell, this.createExpressionBox.bind(this));
        this.confetti = new Confetti(this.appShell);

        initUIContext(this.gameShell, this.operationsBox, this.expressionBoxes, this.confetti);
        this.initDisplay();
    }

    // Manager method for centralizing ExpressionBoxUI creation
    createExpressionBox(x, y, expression = null, leftNumber = null, rightNumber = null, subOperation = null, zIndex = 5) {
        const id = `number${this.expressionBoxes.length}`;
        const box = new ExpressionBoxUI(id, x, y, this.gameShell, expression, leftNumber, rightNumber, subOperation, zIndex);
        this.expressionBoxes.push(box);
        if(box.expression.value === this.logic.target) this.confetti.shoot();
        return box;
    }
    
    initDisplay() {

        // 1. Layout Constants
        const MAX_PER_ROW = 6;
        const BOX_SPACING_X = 105;
        const BOX_SPACING_Y = 135;
        const START_Y = 620;
        const CENTER_X = 317;

        const numbers = this.logic.baseSet || [];
        const totalItems = numbers.length;

        // 2. Process items row by row
        const totalRows = Math.ceil(totalItems / MAX_PER_ROW);

        for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
            const startIndex = rowIndex * MAX_PER_ROW;
            const rowItems = numbers.slice(startIndex, startIndex + MAX_PER_ROW);
            const countInRow = rowItems.length;

            // Calculate starting X so this specific row is centered around CENTER_X
            const rowWidth = (countInRow) * BOX_SPACING_X - 5;
            const startX = CENTER_X - rowWidth / 2;
            const y = START_Y + rowIndex * BOX_SPACING_Y;

            rowItems.forEach((num, colIndex) => {
                const globalIndex = startIndex + colIndex;
                const x = startX + colIndex * BOX_SPACING_X;

                // Use the central manager method instead of instantiating directly
                this.createExpressionBox(x, y, num);
            });
        }

        // 3. Render Target / Objective Element
        const target = this.logic.target;
        const objectiveBox = makeElement("div", {
            className: "objective",
            text: target
        });

        this.gameShell.appendChild(objectiveBox);

        // The settings overlay

        const solutionText = makeElement("h2", {
            text: "Solutions:",
            style: {
                marginTop: "0",
                marginBottom: "12px"
            }
        });

        this.modal = makeElement("div", {
            className: "modal",
            children: [solutionText, ...this.logic.solutions.map(elem => createElementCalculation(elem))]
        });
        
        this.overlay = makeElement("div", {
            className: "overlay",
            children: [this.modal],
            events: {
                click: (event) => {
                    if (event.target === this.overlay) {
                        this.overlay.style.display = "none";
                    }
                }
            }
        });

        this.appShell.appendChild(this.overlay);

        const settingsIcon = makeElement("img", {
            className: "toolbar-icon",
            src:"images/126472.png"
        });

        this.settingsButton = makeElement("button", {
            className: "button",
            style: {
                position: "absolute",
                top: "10px",
                left: "580px"
            },
            children: [settingsIcon],
            events: {
                click: () => {
                    this.overlay.style.display = "flex";
                }
            }
        });

        this.gameShell.appendChild(this.settingsButton);
    }
}