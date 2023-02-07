require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserRoutes = require('./routes/user.routes');

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors())

// ROUTES
app.get('/', (req, res) => res.json({ message: 'Welcome DIF Sistema Integral Padron de Apoyos API 2023' }))
app.use(UserRoutes);

// MONGODB CONNECTION
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB:' + process.env.NODE_ENV))
  .catch(err => console.log('Error connecting to MongoDB: ' + err))

// LISTENER MONGODB CONNECTION
setInterval(function () {
  if(mongoose.connection.readyState !== 1)console.log('Checking MongoDB connection...' + mongoose.connection.readyState);
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB:' + process.env.NODE_ENV))
    .catch(err => console.log('Error connecting to MongoDB: ' + err))
  }
}, 10000); 

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server is running on port: ${port}');
});