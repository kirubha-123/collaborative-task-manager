"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const [, token] = header.split(' ');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = { userId: payload.userId };
        next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
