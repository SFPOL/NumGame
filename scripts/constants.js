// constants.js

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