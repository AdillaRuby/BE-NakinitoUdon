const Validator = require("fastest-validator");
const v = new Validator();

const { response } = require("../helpers/response.formatter");
const { Menu, OrderItem } = require("../models");
const { Op } = require("sequelize");
const fs = require('fs');
const path = require('path');

module.exports = {

  // CREATE MENU
  createMenu: async (req, res) => {
    try {

      const {
        category_id,
        name,
        description,
        price,
        stock,
        status
      } = req.body;

      // schema validasi
      const schema = {
        category_id: {
          type: "number",
          positive: true,
          integer: true
        },

        name: {
          type: "string",
          min: 3
        },

        description: {
          type: "string",
          optional: true
        },

        price: {
          type: "number",
          positive: true,
          integer: true
        },

        stock: {
          type: "number",
          positive: true,
          integer: true
        },

        status: {
          type: "string"
        }
      };

      // data request
      const data = {
        category_id: Number(category_id),
        name: name,
        description: description,
        price: Number(price),
        stock: Number(stock),
        status: status
      };

      // validasi
      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res.status(400).json(
          response(400, "validation error", validate)
        );
      }

      // cek upload gambar
      if (!req.file) {
        return res.status(400).json(
          response(400, "gambar menu wajib diupload")
        );
      }

      // simpan menu
      const menu = await Menu.create({
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        status: data.status,
        image: req.file.filename
      });

      return res.status(201).json(
        response(201, "menu berhasil ditambahkan", menu)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // GET ALL MENU
  getMenu: async (req, res) => {
    try {

      const { name, sortBy, sort } = req.query;

      // Build where clause
      const whereClause = {};
      if (name) {
        whereClause.name = {
          [Op.like]: `%${name}%`
        };
      }

      // Build order clause
      const orderClause = [];
      if (sortBy) {
        orderClause.push([sortBy, sort || "ASC"]);
      }

      const menu = await Menu.findAll({
        where: whereClause,
        order: orderClause
      });

      return res.status(200).json(
        response(200, "success", menu)
      );

    } catch (error) {

      console.error("Error in getMenu:", error);
      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // GET DETAIL MENU
  showMenu: async (req, res) => {
    try {

      // ambil id dari params
      const { id } = req.params;

      // cari menu berdasarkan id
      const menu = await Menu.findByPk(id);

      // cek jika menu tidak ditemukan
      if (!menu) {
        return res.status(404).json(
          response(404, "menu tidak ditemukan")
        );
      }

      return res.status(200).json(
        response(200, "success", menu)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // UPDATE MENU
  updateMenu: async (req, res) => {
    try {

      const { id } = req.params;
      const { name, stock } = req.body;

      // validasi data
      const schema = {
        name: { type: "string", min: 3 },
        stock: { type: "number", positive: true, integer: true }
      };

      const data = {
        name: name,
        stock: Number(stock)
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res.status(400).json(
          response(400, "error validasi", validate)
        );
      }

      // ambil data sebelumnya
      const menu = await Menu.findByPk(id);

      // jika data tidak ada kembalikan error
      if (!menu) {
        return res.status(404).json(
          response(404, "data not found")
        );
      }

      // jika ada, bandingkan stock. stock yang diupdate tidak boleh lebih kecil dari stock saat ini
      if (Number(stock) < Number(menu.stock)) {
        return res.status(400).json(
          response(400, "The updated stock is less than the actual stock.")
        );
      }

      // jika pada req terdapat file
      if (req.file) {
        // karena sebelumnya di model menu, image sudah diberi get sehingga menghasilkan url/nama file
        // jd gunakan getDataValue untuk mengambil nilai asli image dari database
        const rawImageName = menu.getDataValue('image');
        // ambil lokasi gambar sebelumnya
        const oldFilePath = path.join(process.cwd(), 'uploads', rawImageName);
        // jika ada file tersebut hapus
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath); // Menghapus file lama
        }
      }

      // update menu
      const updateProcess = await Menu.update({
        name: data.name,
        stock: data.stock,
        image: (req.file ? req.file.filename : menu.image)
      }, {
        where: { id: id }
      });

      // jika ingin mengembalikan data terbaru, perlu diambil ulang
      // karena hasil dari updateProcess antara 1 (berhasil)/0 (gagal)
      const menuUpdated = await Menu.findByPk(id);

      return res.status(200).json(
        response(200, "updated", menuUpdated)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // DELETE MENU
  deleteMenu: async (req, res) => {
    try {

      const { id } = req.params;

      // include : mengambil relasi melalui model, pastikan sudah didaftarkan di model terkait
      const menu = await Menu.findByPk(id, { include: OrderItem });

      // jika data tidak ada kembalikan error
      if (!menu) {
        return res.status(404).json(
          response(404, "data not found")
        );
      }

      // relasi bertipe hasMany, jika kosong berupa [] = length 0
      if (menu.OrderItems.length === 0) {

        // hapus gambar
        const rawImageName = menu.getDataValue('image');
        if (rawImageName) {
          const oldFilePath = path.join(process.cwd(), 'uploads', rawImageName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        // hapus data jika tidak ada relasi
        const deleteProcess = await Menu.destroy({
          where: { id: id }
        });

        return res.status(200).json(
          response(200, "deleted")
        );

      } else {
        return res.status(400).json(
          response(400, "Menu is already related to an order item")
        );
      }

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  }

};