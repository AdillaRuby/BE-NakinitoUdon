'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderItem.belongsTo(models.Menu, { foreignKey: 'menu_id' });
      OrderItem.belongsTo(models.Order, { foreignKey: 'order_id' });
    }
  }
  OrderItem.init({
    order_id: DataTypes.BIGINT,
    menu_id: DataTypes.BIGINT,
    quantity: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    subtotal: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'OrderItem',
  });
  return OrderItem;
};