/**
 * Script untuk RESET DATABASE
 * - Menghapus semua data dari tabel
 * - Reset auto increment ID kembali ke 1
 * 
 * CARA PAKAI:
 * node reset-database.js
 */

const { sequelize } = require('./models');
const { Transaction, OrderItem, Order, Menu, Category } = require('./models');

async function resetDatabase() {
  try {
    console.log('🔄 Memulai reset database...\n');

    // 1. Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled');

    // 2. Hapus semua data (urutan penting: child dulu, parent terakhir)
    console.log('\n📦 Menghapus data...');
    
    await Transaction.destroy({ where: {}, truncate: true });
    console.log('  ✓ Transactions cleared');
    
    await OrderItem.destroy({ where: {}, truncate: true });
    console.log('  ✓ OrderItems cleared');
    
    await Order.destroy({ where: {}, truncate: true });
    console.log('  ✓ Orders cleared');
    
    await Menu.destroy({ where: {}, truncate: true });
    console.log('  ✓ Menus cleared');
    
    await Category.destroy({ where: {}, truncate: true });
    console.log('  ✓ Categories cleared');

    console.log('\n🔢 Reset auto increment ID...');
    
    // 3. Reset auto increment
    await sequelize.query('ALTER TABLE Transactions AUTO_INCREMENT = 1');
    console.log('  ✓ Transactions ID reset to 1');
    
    await sequelize.query('ALTER TABLE OrderItems AUTO_INCREMENT = 1');
    console.log('  ✓ OrderItems ID reset to 1');
    
    await sequelize.query('ALTER TABLE Orders AUTO_INCREMENT = 1');
    console.log('  ✓ Orders ID reset to 1');
    
    await sequelize.query('ALTER TABLE Menus AUTO_INCREMENT = 1');
    console.log('  ✓ Menus ID reset to 1');
    
    await sequelize.query('ALTER TABLE Categories AUTO_INCREMENT = 1');
    console.log('  ✓ Categories ID reset to 1');

    // 4. Enable foreign key checks kembali
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ Foreign key checks enabled');

    console.log('\n✨ Database berhasil di-reset!');
    console.log('   ID sekarang dimulai dari 1 lagi.');
    console.log('   Users tetap ada agar bisa login.\n');

  } catch (error) {
    console.error('\n❌ Error reset database:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('🔌 Koneksi database ditutup.');
    process.exit(0);
  }
}

// Jalankan reset
resetDatabase();
