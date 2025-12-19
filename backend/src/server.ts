import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

// 1) List of allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://collaborative-task-manager-5dpv-pqhix9sf7.vercel.app',
];

// 2) Optional: also allow CLIENT_ORIGIN from .env if present
if (process.env.CLIENT_ORIGIN) {
  allowedOrigins.push(process.env.CLIENT_ORIGIN);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

// 3) Use the same options for Express and Socket.IO
app.use(cors(corsOptions));

const server = http.createServer(app);

export const io = new Server(server, {
  cors: corsOptions,
});

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || '';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Mongo error:', err));

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(userId);
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log('CORS setup active');
  console.log(`Server running on port ${PORT}`);
});
