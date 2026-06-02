'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Disable foreign key checks untuk menghapus data
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Hapus semua data dari tabel (urutan penting: child dulu, parent terakhir)
    await queryInterface.bulkDelete('Transactions', null, {});
    await queryInterface.bulkDelete('OrderItems', null, {});
    await queryInterface.bulkDelete('Orders', null, {});
    await queryInterface.bulkDelete('Menus', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    // Users tidak dihapus agar admin masih bisa login

    // Reset auto increment ke 1 untuk semua tabel
    await queryInterface.sequelize.query('ALTER TABLE Transactions AUTO_INCREMENT = 1');
    await queryInterface.sequelize.query('ALTER TABLE OrderItems AUTO_INCREMENT = 1');
    await queryInterface.sequelize.query('ALTER TABLE Orders AUTO_INCREMENT = 1');
    await queryInterface.sequelize.query('ALTER TABLE Menus AUTO_INCREMENT = 1');
    await queryInterface.sequelize.query('ALTER TABLE Categories AUTO_INCREMENT = 1');

    // Enable foreign key checks kembali
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Semua data berhasil dihapus dan ID di-reset ke 1');
  },

  async down(queryInterface, Sequelize) {
    console.log('⚠️  Tidak ada rollback untuk migration ini. Data sudah terhapus permanen.');
  }
};
