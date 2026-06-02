'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint dengan ON DELETE CASCADE untuk order_id
    await queryInterface.addConstraint('OrderItems', {
      fields: ['order_id'],
      type: 'foreign key',
      name: 'fk_orderitems_order_id',
      references: {
        table: 'Orders',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add foreign key constraint untuk menu_id
    await queryInterface.addConstraint('OrderItems', {
      fields: ['menu_id'],
      type: 'foreign key',
      name: 'fk_orderitems_menu_id',
      references: {
        table: 'Menus',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('OrderItems', 'fk_orderitems_order_id');
    await queryInterface.removeConstraint('OrderItems', 'fk_orderitems_menu_id');
  }
};
