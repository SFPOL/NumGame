// ============================================================================
//   UI_UTILS.JS - Visual Components & UI Utilities
// ============================================================================

import { Expression } from "./math_utils.js";

// === CONSTANTS & DEFAULTS ===

export const NUMBER_DEFAULTS = {
    size: 100,
    boxShadows: {
        grabbing: "0 8px 16px rgba(0, 0, 0, 0.4)",
        still: "0 3px 6px rgba(0, 0, 0, 0.2)"
    },
    cursors: {
        grab: "grab",
        grabbing: "grabbing"
    }
};

export const OPERATIONS = {
    SUM: "+",
    SUBTRACT: "−",
    MULTIPLY: "×",
    DIVIDE: "÷"
};

export const NUM_TO_OPERATION = ["SUM", "SUBTRACT", "MULTIPLY", "DIVIDE"]

export const OPERATION_CALCULATION = {
    SUM: (a, b) => a + b,
    SUBTRACT: (a, b) => a - b,
    MULTIPLY: (a, b) => a * b,
    DIVIDE: (a, b) => a / b
};

export const OPERATION_COLORS = {
    SUM: {
        primary: "#2ecc71",
        inactive: "#196F3D"
    },
    SUBTRACT: {
        primary: "#e74c3c",
        inactive: "#922B21"
    },
    MULTIPLY: {
        primary: "#f39c12",
        inactive: "#9C640C"
    },
    DIVIDE: {
        primary: "#9b59b6",
        inactive: "#5B2C6F"
    }
};

// === DOM FACTORY HELPER ===

/**
 * Creates DOM elements declaratively to eliminate boilerplate document.createElement code
 */
export function makeElement(tag, {text, style, children, events, ...rest } = {}) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (style) Object.assign(el.style, style);
    if (children) el.append(...children.filter(Boolean));
    if (events) Object.entries(events).forEach(([key, fn]) => el.addEventListener(key, fn));
    Object.entries(rest).forEach(([key, val]) => {
        el[key] = val;
    });

    return el;
}

// === UI CONTEXT INJECTION ===

export let context = {
    gameShell: null,
    operationsBox: null,
    numberBoxes: null,
    confetti: null
};

export function initUIContext(shell, opBox, boxes, conf) {
    context.gameShell = shell;
    context.operationsBox = opBox;
    context.numberBoxes = boxes;
    context.confetti = conf;
}

export function clientToShell(x, y, shell) {
    const rect = shell.getBoundingClientRect();
    
    // Calculate the current CSS scale factor
    const scaleX = rect.width / shell.offsetWidth;
    const scaleY = rect.height / shell.offsetHeight;
    
    return {
        x: (x - rect.left) / scaleX,
        y: (y - rect.top) / scaleY
    };
}

export function shellToClient(x, y, shell) {
    const rect = shell.getBoundingClientRect();
    
    // Calculate the current CSS scale factor
    const scaleX = rect.width / shell.offsetWidth;
    const scaleY = rect.height / shell.offsetHeight;
    
    return {
        x: (x * scaleX) + rect.left,
        y: (y * scaleY) + rect.top
    };
}

// === CONFETTI ANIMATION SYSTEM ===

export class Confetti {

    // Parameters
    COUNT = 400;
    GRAVITY = 0.781; 

    max_cos_a = 0.8775;
    min_cos_a = 0;
    max_v = 170;
    min_v = 0;
    max_size = 10;
    min_size = 1;
    max_k = 0.12;
    min_k = 0.08;

    COLORS = [
        "#FF6B6B", "#FFD166", "#06D6A0", "#9B5DE5",
        "#00BBF9", "#F15BB5", "#FEE440", "#FFFFFF"
    ];

    constructor(shell) {
        this.shell = shell;

        this.canvas = makeElement("canvas", {
            id: "canvasConfetti",
            style: {
                position: "absolute",
                left: "0",
                top: "0",
                width: `100%`,
                height: `100%`,
                pointerEvents: "none",
                zIndex: "1002"
            }
        });
        this.ctx = this.canvas.getContext("2d");
        
        this.shell.appendChild(this.canvas);
        this.resize();
    }

    resize() {
        this.canvas.width = this.shell.offsetWidth;
        this.canvas.height = this.shell.offsetHeight;
        const transform = getComputedStyle(this.shell).transform;
        const scale = transform === 'none' ? 1 : new DOMMatrix(transform).a;
        this.canvas.style.transform = `scale(${1/scale})`;
        const diagonal = Math.sqrt(this.shell.offsetWidth ** 2 + this.shell.offsetHeight ** 2);
        this.max_cos_a = this.shell.offsetWidth / diagonal;
        this.COUNT = 900 * scale**2;
    }

    rand_elem(min, max){
        return Math.random() * (max - min) + min;
    }

    shoot() {
        this.resize();
        const pieces = [];

        for (let s = -1; s <= 1; s += 2) {
            const x = s === -1 ? this.canvas.width : 0;
            const y = this.canvas.height;

            for (let i = 0; i < this.COUNT; i++) {

                const v = this.rand_elem(this.min_v, this.max_v);
                const cos_a = this.rand_elem(this.min_cos_a, this.max_cos_a);
                const k = this.rand_elem(this.min_k, this.max_k);

                pieces.push({
                    x, y, k,
                    vx: s * cos_a * v,
                    vy: - Math.sqrt(1 - cos_a**2) * v,
                    size: this.rand_elem(this.min_size, this.max_size),
                    color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
                    type: Math.floor(Math.random() * 4),
                    rotation: Math.random() * 6,
                    spin: (Math.random() - 0.5) * 0.3,
                    life: 5
                });
            }
        }

        this.animate(pieces);
    }

    animate(pieces) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        pieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            p.vx -= p.k * p.vx;
            p.vy += this.GRAVITY - p.k * p.vy;
            p.rotation += p.spin;
            p.life -= 0.008;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;

            // 0 = rectangle
            // 1 = square
            // 2 = circle
            // 3 = star
            if (p.type === 0) {
                this.ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
            }
            if (p.type === 1) {
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
            if (p.type === 2) {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            if (p.type === 3) {
                this.star(p.size);
            }

            this.ctx.restore();
        });

        if (pieces.some(p => p.life > 0)) {
            requestAnimationFrame(() => this.animate(pieces));
        }
    }

    star(size) {
        this.ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = i * Math.PI / 5;
            const radius = i % 2 ? size / 2 : size;
            this.ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
}

// === EXPRESSION BOX UI COMPONENT ===

export function createElementCalculation(expresion) {

    if(expresion.op === -1) {
        return makeElement("div", {
            className: "number small",
            text: expresion.value,
            style: { position: "relative" }
        });
    }

    const operator = makeElement("div", {
        className: "operatorCalculation",
        text: OPERATIONS[NUM_TO_OPERATION[expresion.op]]
    });

    return makeElement("div", {
        className: "calculation",
        style: { backgroundColor: OPERATION_COLORS[NUM_TO_OPERATION[expresion.op]].primary },
        children: [createElementCalculation(expresion.left), 
                    operator, 
                    createElementCalculation(expresion.right)]
    });
}

export class ExpressionBoxUI {

    width = 100;
    height = 100;

    // DRAGGING Elements
    offsetX = 0;
    offsetY = 0;

    isDragging = false;

    // For calculating purposes
    sideAttached = null;

    // For undo
    lastPointerX = 0;
    lastDirection = 0;
    shakeReversals = [];

    // To pop
    last_time_click = 0;

    constructor(
        id,
        x,
        y,
        shell,
        expression = null,
        leftNumber = null,
        rightNumber = null,
        subOperation = null,
        zIndex = 5
    ) {
        this.id = id;
        this.positionX = x;
        this.positionY = y;
        this.zIndex = zIndex;

        this.color = this.generateColor();
        this.expression = expression ?? new Expression(this.randomNumber());

        this.numberLeft = leftNumber;
        this.numberRight = rightNumber;
        this.subOperation = subOperation;
        
        this.shell = shell;
        this.createElement();

        this.style = this.elemExpr.style;

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
    }

    randomNumber() {
        return Math.floor(Math.random() * 100);
    }

    generateColor() {
        return `hsl(${Math.random() * 360},70%,50%)`;
    }

    getScaleX(value) {
        const digits = String(value).length;
        return digits === 1 ? 1 : Math.max(0.4, 1 - (digits - 2) * (0.13-(digits-2)/100));
    }

    createElement() {

        const text = makeElement("div", {
            id: "text",
            className: "number-text",
            text: this.expression.value,
            style: {
                transform: `scaleX(${this.getScaleX(this.expression.value)})`
            }
        });

        const element = makeElement("div", {
            id: this.id,
            className: "box number",
            style: {
                width: `${this.width}px`,
                height: `${this.height}px`,
                backgroundColor: this.color,
                boxShadow: NUMBER_DEFAULTS.boxShadows.still
            },
            children: [text],
            events: {
                pointerdown: e => this.onPointerDown(e)
            }
        });

        this.elemExpr = makeElement("div", {
            className: "elemExpr",
            style: {
                position: "absolute",
                left: `${this.positionX}px`,
                top: `${this.positionY}px`,
                width: `${this.width}px`,
                height: `${this.height}px`,
                zIndex: this.zIndex
            }
        });

        if (this.subOperation) {
            this.elementCalculation = createElementCalculation(this.expression);
            this.elemExpr.appendChild(this.elementCalculation);
            Object.assign(this.elementCalculation.style, {
                position: "absolute",
                left: "50%",
                top: "0%",
                transform: "translate(-50%, -75%)",
                zIndex: "6"
            });
        }

        this.elemExpr.appendChild(element);
        this.shell.appendChild(this.elemExpr);

        this.element = element;
        this.text = text;
    }

    printCalculation() {
        return this.expression.developed_string();
    }

    moveTo(x, y) {
        x = Math.max(0, x);
        y = Math.max(0, y);

        this.positionX = x;
        this.positionY = y;

        this.style.left = `${x}px`;
        this.style.top = `${y}px`;
    }

    hide() {
        this.style.display = "none";
        this.style.zIndex = 5;

        this.moveTo(0, 0);
        this.detachFromOperation();
        this.animationWiggle(false);
    }

    show() {
        this.style.display = "";
    }

    animationWiggle(enable = true) {
        this.elemExpr.classList.toggle("wiggle", enable);
    }

    animateAccMovement(
        startX,
        startY,
        startVx,
        startVy,
        vMult,
        minVel,
        maxDist
    ) {

        let x = startX;
        let y = startY;
        let vx = startVx;
        let vy = startVy;

        const minVel2 = minVel ** 2;
        const maxDist2 = maxDist ** 2;

        const animate = () => {

            x += vx;
            y += vy;

            vx *= vMult;
            vy *= vMult;

            this.moveTo(x, y);

            if (
                !this.isDragging &&
                (
                    (minVel && minVel2 <= vx ** 2 + vy ** 2) ||
                    (maxDist && (x - startX) ** 2 + (y - startY) ** 2 < maxDist2)
                )
            ) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    onPointerDown(event) {
        event.preventDefault();

        const rect = this.elemExpr.getBoundingClientRect();

        this.offsetX = event.clientX - rect.left;
        this.offsetY = event.clientY - rect.top;

        const time = performance.now();
        if (time - this.last_time_click < 200) { 
            this.split({
                x: this.positionX + this.width / 2,
                y: this.positionY + this.height / 2
            });
        }
        this.last_time_click = time;

        this.animationWiggle(false);
        this.applyInteractionState(true);
        this.detachFromOperation();

        this.isDragging = true;
        this.shell.appendChild(this.elemExpr);

        document.addEventListener("pointermove", this.onPointerMove);
        document.addEventListener("pointerup", this.onPointerUp);
    }

    onPointerMove(event) {
        if (!this.isDragging) return;

        const p = clientToShell(
            event.clientX - this.offsetX,
            event.clientY - this.offsetY,
            this.shell
        );

        this.moveTo(p.x, p.y);
    }

    onPointerUp(event) {

        document.removeEventListener("pointermove", this.onPointerMove);
        document.removeEventListener("pointerup", this.onPointerUp);

        this.isDragging = false;
        this.applyInteractionState(false);

        const side = this.getSideUnderCursor({
            x: event.clientX,
            y: event.clientY
        });

        if (side)
            this.attachToOperationBox(side);
    }

    getSideUnderCursor(cursor) {
        if (this.cursorOnRect(cursor, context.operationsBox.leftSpace.getBoundingClientRect()))
            return "left";

        if (this.cursorOnRect(cursor, context.operationsBox.rightSpace.getBoundingClientRect()))
            return "right";

        return null;
    }

    cursorOnRect(cursor, rect) {
        return (
            cursor.x > rect.left &&
            cursor.x < rect.right &&
            cursor.y > rect.top &&
            cursor.y < rect.bottom
        );
    }

    attachToOperationBox(side) {

        let x, y;

        if (side === "left" && !context.operationsBox.leftNumber) {
            x = context.operationsBox.positionX - this.width - 40;
            context.operationsBox.leftNumber = this;
        } else if (side === "right" && !context.operationsBox.rightNumber) {
            x = context.operationsBox.positionX + 180;
            context.operationsBox.rightNumber = this;
        } else {
            return;
        }

        this.sideAttached = side;
        this.animationWiggle();

        y = context.operationsBox.positionY + (140 - this.height) / 2;
        this.moveTo(x, y);

        context.operationsBox.calculate();
    }

    detachFromOperation() {
        if (!this.sideAttached)
            return;

        if (this.sideAttached === "left")
            context.operationsBox.leftNumber = null;
        else
            context.operationsBox.rightNumber = null;

        this.sideAttached = null;
    }

    split(cursorPosition) {
        const left = this.numberLeft;
        const right = this.numberRight;

        if (!left || !right) return;

        const duration = 180;

        this.isDragging = false;

        this.elemExpr.animate([
            { transform: "scale(1)" },
            { transform: "scale(1)" },
            { transform: "scale(0)" }
        ], {
            duration,
            easing: "ease-out",
            fill: "forwards"
        });

        setTimeout(() => {

            left.show();
            right.show();

            const startX = cursorPosition.x - left.width / 2;
            const startY = cursorPosition.y - left.height / 2;

            left.moveTo(startX, startY);
            right.moveTo(startX, startY);

            const angle = (Math.random() - 0.5) * 0.5;
            const speed = 10;

            left.animateAccMovement(
                startX,
                startY,
                -Math.cos(angle) * speed,
                -Math.sin(angle) * speed,
                0.9,
                0.01,
                null
            );

            right.animateAccMovement(
                startX,
                startY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                0.9,
                0.01,
                null
            );

            setTimeout(() => {

                this.elemExpr.remove();

                const index = context.numberBoxes.indexOf(this);
                if (index !== -1)
                    context.numberBoxes.splice(index, 1);

            }, 120);

        }, duration + 100);
    }

    applyInteractionState(dragging) {

        this.element.style.boxShadow = dragging
            ? NUMBER_DEFAULTS.boxShadows.grabbing
            : NUMBER_DEFAULTS.boxShadows.still;

        this.element.style.cursor = dragging
            ? NUMBER_DEFAULTS.cursors.grabbing
            : NUMBER_DEFAULTS.cursors.grab;
    }
}

// === OPERATIONS BOX CALCULATOR COMPONENT ===

export class OperationsBox {

    static BUTTON_SIZE = 70;
    static RESULT_OFFSET = 20;

    constructor(x, y, operation = "SUM", shell, createBoxCallback) {
        this.positionX = x;
        this.positionY = y;
        this.operation = operation;
        this.shell = shell;
        
        // Store the callback provided by the Game class
        this.createBoxCallback = createBoxCallback;

        this.leftNumber = null;
        this.rightNumber = null;

        [this.leftSpace, this.rightSpace] = this.createSpaces();
        this.elements = {};

        this.createButtons();
        this.highlightSelectedOperation();
    }

    createButtons() {

        const config = [
            ["SUM", 0, 0, "10px 0 0 0"],
            ["SUBTRACT", 70, 0, "0 10px 0 0"],
            ["MULTIPLY", 0, 70, "0 0 0 10px"],
            ["DIVIDE", 70, 70, "0 0 10px 0"]
        ];

        for (const [operation, dx, dy, radius] of config) {

            const button = makeElement("div", {
                className: "box operation",
                text: OPERATIONS[operation],
                style: {
                    left: `${this.positionX + dx}px`,
                    top: `${this.positionY + dy}px`,
                    borderRadius: radius
                },
                events: {
                    click: () => this.selectOperation(operation)
                }
            });

            this.shell.appendChild(button);
            this.elements[operation] = button;
        }
    }

    createSpaces() {

        const width = 200;
        const height = 200;

        const createSpace = (left) => {

            const space = makeElement("div", {
                className: `space ${left ? "left-space" : "right-space"}`,
                style: {
                    width: `${width}px`,
                    height: `${height}px`,
                    left: left ? `${this.positionX + 10 - width}px` : `${this.positionX + 130}px`,
                    top: `${this.positionY + 70 - height / 2}px`
                }
            });

            this.shell.appendChild(space);
            return space;
        };

        return [
            createSpace(true),
            createSpace(false)
        ];
    }

    selectOperation(operation) {

        if (this.operation === operation)
            return;

        this.operation = operation;
        this.highlightSelectedOperation();
    }

    highlightSelectedOperation() {

        for (const operation in this.elements) {

            const selected = operation === this.operation;
            const colors = OPERATION_COLORS[operation];
            const style = this.elements[operation].style;

            style.backgroundColor =
                selected
                    ? colors.primary
                    : colors.inactive;

            style.cursor =
                selected
                    ? "default"
                    : "pointer";

            style.color =
                selected
                    ? "white"
                    : "grey";
        }
    }

    isValidOperation(left, right) {

        switch (this.operation) {

            case "DIVIDE":
                return right !== 0 && left % right === 0;

            case "SUBTRACT":
                return left >= right;

            default:
                return true;
        }
    }

    calculate() {

        if (!this.leftNumber || !this.rightNumber)
            return null;

        const leftValue = this.leftNumber.expression.value;
        const rightValue = this.rightNumber.expression.value;

        if (!this.isValidOperation(leftValue, rightValue))
            return null;

        const operationMap = {
            SUM: 0,
            SUBTRACT: 1,
            MULTIPLY: 2,
            DIVIDE: 3
        };

        const resultExpression = new Expression(
            null,
            operationMap[this.operation],
            this.leftNumber.expression,
            this.rightNumber.expression
        );

        this.animateMerge();

        setTimeout(() => {
            
            // Create the element via the injected callback
            const number = this.createBoxCallback(
                this.positionX + OperationsBox.RESULT_OFFSET,
                this.positionY + OperationsBox.RESULT_OFFSET,
                resultExpression,
                this.leftNumber,
                this.rightNumber,
                this.operation,
                2
            );

            this.leftNumber.hide();
            this.rightNumber.hide();

            // context.numberBoxes.push(number) -> REMOVED. 

            this.animateResult(number);

            setTimeout(() => {
                number.style.zIndex = 5;
                number.elementCalculation.style.zIndex = 6;
            }, 300);

        }, 200);

        return resultExpression;
    }

    animateMerge() {

        const left = this.leftNumber;
        const right = this.rightNumber;

        left.style.zIndex = 2;
        right.style.zIndex = 2;

        const y = left.positionY;
        const velocity = 12;

        left.animateAccMovement(
            left.positionX,
            y,
            velocity,
            0,
            1.05,
            null,
            160
        );

        right.animateAccMovement(
            right.positionX,
            y,
            -velocity,
            0,
            1.05,
            null,
            160
        );
    }

    animateResult(number) {

        const x =
            this.positionX + OperationsBox.RESULT_OFFSET;

        const y =
            this.positionY + OperationsBox.RESULT_OFFSET;

        number.animateAccMovement(
            x,
            y,
            0,
            18,
            0.9,
            0.2,
            null
        );
    }
}