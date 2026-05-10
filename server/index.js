import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as db from './database.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json());

// --- WEBSOCKETS ---
io.on('connection', (socket) => {
  console.log('A device connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Device disconnected:', socket.id);
  });
});

const broadcastUpdate = (action) => {
  io.emit('database_update', { action, timestamp: Date.now() });
};

// --- MENU API ---
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await db.getMenu();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const result = await db.addMenuItem(req.body);
    broadcastUpdate('menu_added');
    res.json({ success: true, id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const item = { ...req.body, id: req.params.id };
    await db.updateMenuItem(item);
    broadcastUpdate('menu_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    await db.deleteMenuItem(req.params.id);
    broadcastUpdate('menu_deleted');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BILLING API ---
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await db.getBills();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const result = await db.createBill(req.body);
    broadcastUpdate('bill_created');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  try {
    const billData = { ...req.body, id: req.params.id };
    const result = await db.updateBill(billData);
    broadcastUpdate('bill_updated');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', async (req, res) => {
  try {
    await db.deleteBill(req.params.id);
    broadcastUpdate('bill_deleted');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DASHBOARD API ---
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
