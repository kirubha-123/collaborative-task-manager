import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('__dirname =', __dirname);
console.log('MONGO_URI =', process.env.MONGO_URI);
