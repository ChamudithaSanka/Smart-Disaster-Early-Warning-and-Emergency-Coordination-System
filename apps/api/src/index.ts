import 'dotenv/config';
import 'express-async-errors';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { warnings } from './routes/warnings';
import { reports } from './routes/reports';
import { rescue } from './routes/rescue';
import { centres, relief, misc } from './routes/centres';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.get('/api/health', (_q, r) => r.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/warnings', warnings);
app.use('/api/reports', reports);
app.use('/api/rescue', rescue);
app.use('/api/centres', centres);
app.use('/api/relief', relief);
app.use('/api', misc);
app.use((err: any, _q: Request, res: Response, _n: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});
const port = Number(process.env.PORT) || 4000;
app.listen(port, '0.0.0.0', () => console.log(`API running on http://localhost:${port}`));
