"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketContext = exports.socket = void 0;
const react_1 = __importDefault(require("react"));
const socket_io_client_1 = require("socket.io-client");
//Create a context to resue socket connection throughout the app
exports.socket = (0, socket_io_client_1.io)();
exports.SocketContext = react_1.default.createContext(exports.socket);
