"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.default.create({ name, email, password: hash });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(201).json({
            user: { id: user._id, name: user.name, email: user.email },
            token,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            user: { id: user._id, name: user.name, email: user.email },
            token,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
});
exports.default = router;
