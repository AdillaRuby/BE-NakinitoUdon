const express = require('express')
const app = express()
const port = 3000
const db = require('./models');
const methodOverride = require('method-override')
const cors = require('cors');

const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const transactionRoutes = require('./routes/transaction.routes');
const loginRoutes = require('./routes/login.routes');
const { verifyToken } = require('./middlewares/auth');

db.sequelize.authenticate()
    .then(() => console.log('Model ORM terhubung'))
    .catch((err) => console.error(err.massage));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(methodOverride('_method'))
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static('uploads'));
app.use('/api/menus', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/login', loginRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})