const multer = require('multer');
//multer : package untuk upload file, path : package untuk akses folder file
const path = require('path');

const storage = multer.diskStorage({
    // destination : mengatur tempat folder gambar akan disimpan
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'))
  },
  // filename : memberi nama file yang diupload
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const name = uniqueSuffix + path.extname(file.originalname);
    cb(null, name)
  }
})

module.exports = multer({storage})