// 1. Load environment variables before using them
const dotenv = require('dotenv');
dotenv.config({ path: './starter/config.env' });

process.on('uncaughtException', (err) => {
  console.log('🎃 [SERVER.JS]UNCAUGHT EXCEPTIONS! 🧨Shutting down...');
  console.log('err.name:', err.name, 'err.message:', err.message);
  process.exit(1);
});

// 2. Now you can safely require other modules that depend on those variables
const mongoose = require('mongoose');

// 3. Next, require your app.js module (e.g., Express application)
const app = require('./app');

// 4. Next, you can connect to your MONGODB (compass)
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('🎃[SERVER.JS] MONGODB connection successful!');
  });

// 5. Finally, you can start your server.
const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log('🎃[SERVER.JS] app.listen ON PORT:', port);
});

process.on('unhandledRejection', (err) => {
  console.log('🎃[SERVER.JS] UNDEHANDLER REJECTION! 🧨Shutting down...');
  console.log('err.name:', err.name, 'err.message:', err.message);
  server.close(() => {
    process.exit(1);
  });
});
