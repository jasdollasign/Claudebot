import express from 'express';
import cors from 'cors';
import { getDb } from './models/database';
import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';
import bookingRoutes from './routes/bookings';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import providerRoutes from './routes/providers';
import notificationRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Initialize database
getDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Home Services Marketplace API running on port ${PORT}`);
});

export default app;
