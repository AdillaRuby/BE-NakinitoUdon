const Validator = require("fastest-validator");
const v = new Validator();

const { response } = require("../helpers/response.formatter");
const { Order, OrderItem, Menu } = require("../models");
const { Op } = require("sequelize");

module.exports = {

  // CREATE ORDER
  createOrder: async (req, res) => {
    try {

      const { table_number, customer_name, notes, items: itemsRaw } = req.body;
      // items dikirim sebagai JSON string dari form-data
      const items = typeof itemsRaw === 'string' ? JSON.parse(itemsRaw) : itemsRaw;

      // validasi data
      const schema = {
        table_number: { type: "string", min: 1 },
        customer_name: { type: "string", min: 3 },
        notes: { type: "string", optional: true },
        items: { type: "array", min: 1 }
      };

      const data = {
        table_number: table_number,
        customer_name: customer_name,
        notes: notes,
        items: items
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res.status(400).json(
          response(400, "error validasi", validate)
        );
      }

      // cek setiap menu_id pada items
      let total_price = 0;
      const orderItemsData = [];

      for (const item of items) {
        // cek jika menu_id tidak tersedia datanya pada menu
        const menu = await Menu.findByPk(item.menu_id);
        if (!menu) {
          return res.status(400).json(
            response(400, `Menu dengan id ${item.menu_id} tidak ditemukan`)
          );
        }

        // cek jika quantity melebihi stock yang tersedia
        if (item.quantity > menu.stock) {
          return res.status(400).json(
            response(400, `Stock menu ${menu.name} tidak mencukupi`)
          );
        }

        const price = menu.price;
        const subtotal = price * item.quantity;
        total_price += subtotal;

        orderItemsData.push({
          menu_id: item.menu_id,
          quantity: item.quantity,
          price: price,
          subtotal: subtotal,
          menuStock: menu.stock  // simpan stock saat ini untuk dikurangi nanti
        });
      }

      // buat order
      const order = await Order.create({
        table_number: data.table_number,
        customer_name: data.customer_name,
        notes: data.notes,
        total_price: total_price,
        status: "pending"
      });

      // buat order items dan kurangi stock menu
      for (const itemData of orderItemsData) {
        await OrderItem.create({
          order_id: order.id,
          menu_id: itemData.menu_id,
          quantity: itemData.quantity,
          price: itemData.price,
          subtotal: itemData.subtotal
        });

        // kurangi stock di menu
        await Menu.update({
          stock: itemData.menuStock - itemData.quantity
        }, {
          where: { id: itemData.menu_id }
        });
      }

      // ambil order beserta items-nya
      const orderCreated = await Order.findByPk(order.id, {
        include: [{ model: OrderItem }]
      });

      return res.status(201).json(
        response(201, "order berhasil dibuat", orderCreated)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // GET ALL ORDER
  getOrder: async (req, res) => {
    try {

      // jika tidak ada query params page, isi sebagai angka 1 pagenya
      // tidak menggunakan destruktur () karena dipanggil langsung di kanan .page dan .limit
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 5;

      // rumus mengambil data pagination : offset = (page - 1) * limit
      // offset : mengambil data mulai dari angka yg ditentukan. misal offset 10 artinya mengambil data mulai dari baris ke 11
      // limit : maksimal data yang dimunculkan
      // (1-1) * 5 = 0 * 5 = 0, offset 0 artinya page 1 data dimulai dari baris ke 1 sampai 5 (limit)
      // (2-1) * 5 = 1 * 5 = 5, offset 5 artinya page 2 data dimulai dari baris ke 6 sampai 10 (limit)
      const offset = (page - 1) * limit;

      const { count, rows } = await Order.findAndCountAll({
        offset: offset,
        limit: limit,
        include: [{ model: OrderItem }]
      });

      const formatPagination = {
        data: rows,           // detail data
        limit: limit,         // limit per page
        rangeData: (offset + 1) + "~" + (offset + rows.length), // baris data yg dimunculkan
        currentPage: page,    // posisi page pagination
        totalPage: Math.round(count / limit), // jumlah halaman pagination
        total: count          // jumlah seluruh data
      };

      return res.status(200).json(
        response(200, "success", formatPagination)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // GET DETAIL ORDER
  showOrder: async (req, res) => {
    try {

      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [{ model: OrderItem }]
      });

      if (!order) {
        return res.status(404).json(
          response(404, "order tidak ditemukan")
        );
      }

      return res.status(200).json(
        response(200, "success", order)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // UPDATE ORDER STATUS
  updateOrder: async (req, res) => {
    try {

      const { id } = req.params;
      const { status } = req.body;

      // validasi
      const schema = {
        status: { type: "string", enum: ["pending", "process", "done", "delivered"] }
      };

      const validate = v.validate({ status }, schema);

      if (validate.length > 0) {
        return res.status(400).json(
          response(400, "error validasi", validate)
        );
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json(
          response(404, "order tidak ditemukan")
        );
      }

      await Order.update({ status }, { where: { id } });

      const updatedOrder = await Order.findByPk(id, {
        include: [{ model: OrderItem }]
      });

      return res.status(200).json(
        response(200, "order berhasil diupdate", updatedOrder)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // DELETE ORDER
  deleteOrder: async (req, res) => {
    try {

      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [{ model: OrderItem }]
      });

      if (!order) {
        return res.status(404).json(
          response(404, "order tidak ditemukan")
        );
      }

      // hapus order items dulu
      await OrderItem.destroy({ where: { order_id: id } });

      // hapus order
      await Order.destroy({ where: { id } });

      return res.status(200).json(
        response(200, "order berhasil dihapus")
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  }

};
