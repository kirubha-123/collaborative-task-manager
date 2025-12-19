"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const registerUser = async (name, email, password) => {
    const existing = await User_1.default.findOne({ email });
    if (existing) {
        throw new Error('Email already in use');
    }
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.default.create({ name, email, password: hashed });
    const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return {
        user: { id: user._id.toString(), name: user.name, email: user.email },
        token
    };
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await User_1.default.findOne({ email });
    if (!user)
        throw new Error('Invalid credentials');
    const match = await bcryptjs_1.default.compare(password, user.password);
    if (!match)
        throw new Error('Invalid credentials');
    const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return {
        user: { id: user._id.toString(), name: user.name, email: user.email },
        token
    };
};
exports.loginUser = loginUser;
