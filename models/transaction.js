'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Transaction.belongsTo(models.Order, { foreignKey: 'order_id' });
    }
  }
  Transaction.init({
    order_id: DataTypes.BIGINT,
    payment_method: DataTypes.STRING,
    total_payment: DataTypes.INTEGER,
    money_received: DataTypes.INTEGER,
    change_money: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};