'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id' });
      Order.hasOne(models.Transaction, { foreignKey: 'order_id' });
    }
  }
  Order.init({
    table_number: DataTypes.STRING,
    customer_name: DataTypes.STRING,
    notes: DataTypes.TEXT,
    total_price: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};