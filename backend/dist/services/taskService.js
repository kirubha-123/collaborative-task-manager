"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.__test = exports.getUserTasks = exports.deleteTask = exports.updateTask = exports.createTask = exports.CreateTaskDto = void 0;
const zod_1 = require("zod");
const Task_1 = __importDefault(require("../models/Task"));
const server_1 = require("../server");
exports.CreateTaskDto = zod_1.z.object({
    title: zod_1.z.string().max(100),
    description: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    priority: zod_1.z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
    status: zod_1.z
        .enum(['To Do', 'In Progress', 'Review', 'Completed'])
        .default('To Do'),
    assignedToId: zod_1.z.string().optional(),
});
const UpdateTaskDto = exports.CreateTaskDto.partial();
const createTask = async (data, creatorId) => {
    const validated = exports.CreateTaskDto.parse(data);
    const task = await Task_1.default.create({
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        creatorId,
    });
    if (validated.assignedToId) {
        server_1.io.to(validated.assignedToId).emit('assignmentNotification', task);
    }
    server_1.io.emit('taskUpdate', task);
    return task;
};
exports.createTask = createTask;
const updateTask = async (taskId, updates) => {
    const validated = UpdateTaskDto.parse(updates);
    const docUpdates = { ...validated };
    if (validated.dueDate) {
        docUpdates.dueDate = new Date(validated.dueDate);
    }
    const task = await Task_1.default.findByIdAndUpdate(taskId, docUpdates, {
        new: true,
    });
    if (task) {
        if (validated.assignedToId) {
            server_1.io.to(validated.assignedToId).emit('assignmentNotification', task);
        }
        server_1.io.emit('taskUpdate', task);
    }
    return task;
};
exports.updateTask = updateTask;
const deleteTask = async (taskId) => {
    await Task_1.default.findByIdAndDelete(taskId);
    server_1.io.emit('taskDeleted', { id: taskId });
};
exports.deleteTask = deleteTask;
const getUserTasks = async (userId) => {
    const assigned = await Task_1.default.find({ assignedToId: userId });
    const created = await Task_1.default.find({ creatorId: userId });
    const now = new Date();
    const overdue = await Task_1.default.find({
        assignedToId: userId,
        dueDate: { $lt: now },
        status: { $ne: 'Completed' },
    });
    return { assigned, created, overdue };
};
exports.getUserTasks = getUserTasks;
// helper export for tests (DTO etc.)
exports.__test = {
    CreateTaskDto: exports.CreateTaskDto,
};
