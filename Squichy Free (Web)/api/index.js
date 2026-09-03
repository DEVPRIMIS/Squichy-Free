const express = require('express');
const app = express();

app.set('trust proxy', true);
app.use(express.json());

const setupApiRoutes = require('./api-routes');
setupApiRoutes(app);

module.exports = app;
