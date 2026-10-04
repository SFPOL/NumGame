// ============================================================================
//   BOARD.JS - Interactive Whiteboard Canvas
// ============================================================================

import { makeElement } from "./ui_utils.js";

export class Board {

    constructor(shell){
        this.shell = shell;

        // Populate DOM elements using clean factory helper
        this.buildUI();

        // Canvas context initialization
        this.canvasCTX = this.canvas.getContext("2d");

        // These are global variables and configurations
        this.activeTool = false;
        this.erasing = false;

        this.resize();
        this.addEventListeners();
    }

    buildUI() {

        // ? TOOL SECTION
        
        // Brush
        this.brushIcon = makeElement("img", {
            id: "brushIcon",
            className: "toolIcon",
            src: "images/brush.png"
        });

        this.brushBttn = makeElement("button", {
            id: "brushBttn",
            className: "button",
            children: [this.brushIcon],
            events: {
                click: this.paint
            }
        });

        this.colorPckrIcon = makeElement("img", {
            id: "toolIcon",
            className: "toolIcon",
            src: "images/brush.png"
        });

        this.colorPckr = makeElement("input", {
            id: "colorPckr",
            type: "color",
            value: "#000000",
            events: {
                input: () => {
                    this.toolCursor.style.borderColor = this.colorPckr.value;
                    this.toolCursor.style.backgroundColor = `${this.colorPckr.value}22`;
                    this.adjustBrushIconsColor(this.colorPckr.value);
                }
            }
        });

        this.adjustBrushIconsColor(this.colorPckr.value);

        this.colorPckrWrapper = makeElement('div', {
            className: 'colorPckrWrapper',
            children: [this.colorPckr, this.colorPckrIcon]
        });

        this.brushSlot = makeElement('div', { 
            className: 'brush-slot',
            children: [this.colorPckrWrapper]
        });

        // Eraser
        this.eraserIcon = makeElement("img", {
            id: "eraserIcon",
            className: "toolIcon",
            src: "images/eraser.png"
        });

        this.eraserBttn = makeElement("button", {
            id: "eraserBttn",
            className: "button",
            children: [this.eraserIcon],
            events: {
                click: this.erase
            }
        });

        // ? BRUSH SECTION

        this.sizeValueBrush = 5

        this.sizePickersBrush = [];

        for (let [index, value] of [5, 10, 15, 20].entries()) {
            const isDefault = index === 0;

            this.sizePickersBrush.push(
                makeElement("button", {
                    id: `sizePickerBrush${value}`,
                    className: isDefault ? "button selected" : "button",
                    text: `${value}`,
                    events: {
                        click: () => {
                            // Remove "active" class from all buttons
                            this.sizePickersBrush.forEach(element => {
                                element.classList.remove("selected");
                            });

                            // Add "active" class to the clicked button
                            this.sizePickersBrush[index].classList.add("selected");

                            this.sizeValueBrush = value;
                        }
                    }
                })
            );
        }

        this.brushSection = makeElement("div", {
            id: "brushSection",
            className: "toolSection",
            children: [...this.sizePickersBrush]
        });

        // ? ERASER SECTION

        this.sizeValueEraser = 20

        this.sizePickersEraser = [];
        for (let [index, value] of [30, 50, 70, 90].entries()) {
            const isDefault = index === 0;

            this.sizePickersEraser.push(
                makeElement("button", {
                    id: `sizePickerEraser${value}`,
                    className: isDefault ? "button selected" : "button",
                    text: `${value}`,
                    events: {
                        click: () => {
                            // Remove "active" class from all buttons
                            this.sizePickersEraser.forEach(element => {
                                element.classList.remove("selected");
                            });

                            // Add "active" class to the clicked button
                            this.sizePickersEraser[index].classList.add("selected");

                            this.sizeValueEraser = value;
                        }
                    }
                })
            );
        }

        this.eraserSection = makeElement("div", {
            id: "eraserSection",
            className: "toolSection hidden",
            children: [...this.sizePickersEraser]
        });

        // ? CLOSE BUTTON
        this.closeBttn = makeElement("button", {
            id: "closeBttn",
            className: "button",
            text: "↥",
            events: {
                click: this.closeCanvas
            }
        });

        // ? CLEAR BOARD BUTTON
        const clearIcon = makeElement("img", {
            id: "clearIcon",
            className: "toolbar-icon",
            src: "images/5507757-200.png"
        });

        this.clearBttn = makeElement("button", {
            id: "clearBttn",
            className: "button",
            children: [clearIcon],
            events: {
                click: this.clear
            }
        });

        // DIVIDER

        this.divider = makeElement("div", {
            id: "divider",
            className: "divider"
        })

        // * ALL INSIDE THE TOOLBAR
        this.toolBar = makeElement("div", {
            id: "toolBar",
            children: [this.closeBttn, this.clearBttn, this.divider, this.brushSlot, 
                       this.eraserBttn, this.brushSection, this.eraserSection]
        });

        // And the canvas, where we write
        this.canvas = makeElement("canvas", { 
            id: "canvasWB",
            events: {
                mousedown: this.startPainting,
                mousemove: (e) => {
                    this.move(e);
                    this.updateCursor(e);
                },
                mouseup: this.endPainting,
                mouseleave: (e) => {
                    this.endPainting();
                    this.toolCursor.style.display = "none";
                },
                mouseenter: () => {
                    this.toolCursor.style.display = "block";
                },
                touchstart: (e) => {
                    this.startPainting(e);
                    this.updateCursor(e);
                    this.toolCursor.style.display = "block";
                },
                touchend: () => {
                    this.endPainting();
                    this.toolCursor.style.display = "none";
                }
            }
        });

        // This tool cursor is so that we can see where are you drawing
        this.toolCursor = makeElement("div", {
            id: "toolCursor",
            className: "brush",
            style: {
                borderColor: this.colorPckr.value,
                backgroundColor: `${this.colorPckr.value}22`
            }
        });

        // This is the actual board. 
        this.board = makeElement("div", {
            id: "boardPanel",
            children: [this.toolCursor, this.toolBar, this.canvas]
        });

        // This is the tab to access the whiteboard
        const whiteboardIcon = makeElement("img", {
            id: "whiteboardIcon",
            className: "toolbar-icon",
            src: "images/whiteboard_regular_icon_203061.png"
        });

        const whiteboardText = makeElement("div", { text: "Whiteboard" });

        this.tab = makeElement("div", {
            id: "tab",
            children: [whiteboardIcon, whiteboardText],
            events: {
                click: this.openCanvas
            }
        });

        this.shell.append(this.tab, this.board);
    }

    adjustBrushIconsColor(hex){
        // Remove leading # if present
        hex = hex.replace("#", "");

        // Parse R, G, B values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Standard formula for relative perceived brightness / whiteness (0 to 255)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        this.colorPckrIcon.style.filter = brightness < 128 ? "invert(100%)" : "invert(0%)";
        this.brushIcon.style.backgroundColor = hex;
    }

    // --- CANVAS EVENT HANDLERS ---

    resize = () => {
        const previousImage = this.canvas.width > 0 && this.canvas.height > 0
            ? this.canvasCTX.getImageData(0, 0, this.canvas.width, this.canvas.height)
            : null;

        const width = Math.max(1, Math.round(this.canvas.offsetWidth || this.canvas.clientWidth || 0));
        const height = Math.max(1, Math.round(this.canvas.offsetHeight || this.canvas.clientHeight || 0));

        this.canvas.width = width;
        this.canvas.height = height;

        this.canvasCTX.lineCap = "round";
        this.canvasCTX.lineJoin = "round";

        if (previousImage && previousImage.width > 0 && previousImage.height > 0) {
            this.canvasCTX.putImageData(previousImage, 0, 0);
        }
    }

    getPos = (e) => {
        const r = this.canvas.getBoundingClientRect();
        const scaleX = r.width / (this.canvas.offsetWidth || this.canvas.clientWidth || 1);
        const scaleY = r.height / (this.canvas.offsetHeight || this.canvas.clientHeight || 1);

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: (clientX - r.left) / scaleX,
            y: (clientY - r.top) / scaleY
        };
    }

    move = (e) => {
        if (!this.activeTool) return;

        e.preventDefault();

        const p = this.getPos(e);

        this.toolCursor.style.left = `${p.x}px`;
        this.toolCursor.style.top = `${p.y}px`;

        if (this.erasing) {
            this.canvasCTX.lineWidth = this.sizeValueEraser
            this.canvasCTX.globalCompositeOperation = "destination-out";
        } else {
            this.canvasCTX.lineWidth = this.sizeValueBrush
            this.canvasCTX.globalCompositeOperation = "source-over";
            this.canvasCTX.strokeStyle = this.colorPckr.value;
        }

        this.canvasCTX.lineTo(p.x, p.y);
        this.canvasCTX.stroke();
    }

    updateCursor = (e) => {

        const p = this.getPos(e);

        this.toolCursor.style.left = `${p.x}px`;
        this.toolCursor.style.top = `${p.y}px`;

        const size = Number(this.erasing ? this.sizeValueEraser : this.sizeValueBrush);

        this.toolCursor.style.width = `${size}px`;
        this.toolCursor.style.height = `${size}px`;
    }



    clear = () => {
        this.canvasCTX.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    openCanvas = () => {
        this.board.classList.add("open");
        this.tab.style.transform = `translate(-50%, ${this.shell.offsetHeight}px)`;

        this.resize();
    }

    closeCanvas = () => {
        this.board.classList.remove("open");
        this.tab.style.transform = ``;
    }

    paint = () => {
        this.erasing = false;
        this.brushSlot.replaceChildren(this.colorPckrWrapper);
        this.brushSection.classList.remove("hidden");
        this.eraserSection.classList.add("hidden");
        this.eraserBttn.classList.remove("selected");
        this.colorPckrIcon.classList.add("brush");
    }

    startPainting = (e) => {
        this.activeTool = true;

        const p = this.getPos(e);

        this.canvasCTX.beginPath();
        this.canvasCTX.moveTo(p.x, p.y);
    }

    endPainting = () => {
        this.activeTool = false;
    }

    erase = () => {
        this.erasing = true;
        this.brushSlot.replaceChildren(this.brushBttn);
        this.brushSection.classList.add("hidden");
        this.eraserSection.classList.remove("hidden");
        this.eraserBttn.classList.add("selected");
        
        this.eraserIcon.classList.remove("eraser");
        void this.eraserIcon.offsetWidth;
        this.eraserIcon.classList.add("eraser");
    }

    addEventListeners(){
        // touchmove requires { passive: false } to allow e.preventDefault(), 
        // which standard event maps in helpers typically don't support natively.
        this.canvas.addEventListener("touchmove", this.move, { passive: false });
        this.canvas.addEventListener("touchmove", this.updateCursor, { passive: false });
        
        // Window is not created with makeElement, so its event remains here
        window.addEventListener("resize", this.resize);
    }

}