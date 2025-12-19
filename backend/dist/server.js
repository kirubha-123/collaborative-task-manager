"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
const corsOptions = {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
};
app_1.default.use((0, cors_1.default)(corsOptions));
const server = http_1.default.createServer(app_1.default);
exports.io = new socket_io_1.Server(server, {
    cors: corsOptions,
});
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || '';
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('Mongo error:', err));
exports.io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('join', (userId) => {
        socket.join(userId);
    });
});
app_1.default.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
server.listen(PORT, () => {
    console.log('CORS setup active');
    console.log(`Server running on port ${PORT}`);
});
