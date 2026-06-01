'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Menu.hasMany(models.OrderItem, { foreignKey: 'menu_id' });
    }
  }
  Menu.init({
    category_id: DataTypes.BIGINT,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    stock: DataTypes.INTEGER,
    image: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('image');
        return rawValue ? `http://localhost:3000/uploads/${rawValue}` : null;
      }
    },
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Menu',
  });
  return Menu;
};