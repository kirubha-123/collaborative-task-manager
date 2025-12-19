import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
};

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
