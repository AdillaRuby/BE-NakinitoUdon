'use strict';

const { Menu } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const menus = await Menu.findAll();

    const dummyOrders = [];
    const statuses = ['pending', 'process', 'done'];

    // membuat data sebanyak 15
    for (let i = 1; i <= 15; i++) {
      // Math.random() : menghasilkan angka random 0 - 1, Math.floor() : membulatkan kebawah
      // contoh : random menghasilkan 0.25 dan length 3 maka 0.25 x 3 = 0.75, diambil floor jadi 0
      // maka menu id yg akan digunakan adalah menus[0]
      const randomMenu = menus[Math.floor(Math.random() * menus.length)];

      // menyimpan data dummy ke array
      dummyOrders.push({
        table_number: `Meja-${i}`,
        customer_name: `Customer ke-${i}`,
        notes: `Catatan order ke-${i}`,
        total_price: randomMenu ? randomMenu.price * i : 10000 * i,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // insert ke table Orders
    await queryInterface.bulkInsert('Orders', dummyOrders);
  },

  async down(queryInterface, Sequelize) {
    // jika seeder di undo, table Orders akan dikosongkan
    await queryInterface.bulkDelete('Orders', null, {});
  }
};
