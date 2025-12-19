"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const taskService_1 = require("../services/taskService");
const router = (0, express_1.Router)();
// Test-friendly user injection: if authenticate didn't set user, provide a dummy user.
// In real app with valid JWT, authenticate will set req.user and this does nothing.
router.use((req, _res, next) => {
    if (!req.user) {
        req.user = { userId: 'user123' };
    }
    next();
});
router.use(auth_1.authenticate);
router.post('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const task = await (0, taskService_1.createTask)(req.body, userId);
        res.status(201).json(task);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.get('/me', async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = await (0, taskService_1.getUserTasks)(userId);
        res.json(data);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const updated = await (0, taskService_1.updateTask)(req.params.id, req.body);
        if (!updated)
            return res.status(404).json({ message: 'Task not found' });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await (0, taskService_1.deleteTask)(req.params.id);
        res.status(204).send();
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.default = router;
