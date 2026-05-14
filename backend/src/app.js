const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
 
const authRouter = require('./modules/auth/auth.router');
// Add more routers here as you build them:
// const projectRouter = require('./modules/projects/projects.router');
 
const app = express();
app.use(cors());
app.use(express.json());
 
// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
 
app.use('/api/auth', authRouter);
// app.use('/api/projects', projectRouter);
 
app.get('/health', (req, res) => res.json({ status: 'ok', env: 'local' }));
 
module.exports = app;
 
