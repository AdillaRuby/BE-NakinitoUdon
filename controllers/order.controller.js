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

      // buat order dengan status "unpaid" (belum dibayar)
      const order = await Order.create({
        table_number: data.table_number,
        customer_name: data.customer_name,
        notes: data.notes,
        total_price: total_price,
        status: "unpaid"  // Status awal: unpaid, belum muncul di dashboard admin
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

      // ambil order beserta items-nya dengan detail menu
      const orderCreated = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ['id', 'name', 'image', 'price']
              }
            ]
          }
        ]
      });

      // Format response dengan items
      const orderData = orderCreated.toJSON();
      if (orderData.OrderItems) {
        orderData.items = orderData.OrderItems.map(item => ({
          menu_id: item.menu_id,
          menu_name: item.Menu ? item.Menu.name : null,
          name: item.Menu ? item.Menu.name : null,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          image: item.Menu ? item.Menu.image : null
        }));
        delete orderData.OrderItems;
      }

      return res.status(201).json(
        response(201, "order berhasil dibuat", orderData)
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

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 5;
      const status = req.query.status; // filter status

      const offset = (page - 1) * limit;

      // Build where clause untuk filter status
      // DEFAULT: Hanya tampilkan order yang sudah PAID (untuk dashboard admin)
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      } else {
        // Jika tidak ada filter status, tampilkan semua KECUALI unpaid
        whereClause.status = {
          [Op.ne]: 'unpaid'  // ne = not equal, jadi tidak termasuk unpaid
        };
      }

      const { count, rows } = await Order.findAndCountAll({
        where: whereClause,
        offset: offset,
        limit: limit,
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ['id', 'name', 'image', 'price']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Format response dengan items
      const formattedRows = rows.map(order => {
        const orderData = order.toJSON();
        if (orderData.OrderItems) {
          orderData.items = orderData.OrderItems.map(item => ({
            menu_id: item.menu_id,
            menu_name: item.Menu ? item.Menu.name : null,
            name: item.Menu ? item.Menu.name : null,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            image: item.Menu ? item.Menu.image : null
          }));
          delete orderData.OrderItems;
        }
        return orderData;
      });

      const formatPagination = {
        data: formattedRows,
        limit: limit,
        rangeData: (offset + 1) + "~" + (offset + rows.length),
        currentPage: page,
        totalPage: Math.ceil(count / limit),
        total: count
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

      // JOIN dengan OrderItems dan Menu untuk mendapatkan detail lengkap
      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ['id', 'name', 'image', 'price']
              }
            ]
          }
        ]
      });

      if (!order) {
        return res.status(404).json(
          response(404, "order tidak ditemukan")
        );
      }

      // Format response agar items berisi detail menu
      const orderData = order.toJSON();
      if (orderData.OrderItems) {
        orderData.items = orderData.OrderItems.map(item => ({
          menu_id: item.menu_id,
          menu_name: item.Menu ? item.Menu.name : null,
          name: item.Menu ? item.Menu.name : null,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          image: item.Menu ? item.Menu.image : null
        }));
        delete orderData.OrderItems;
      }

      return res.status(200).json(
        response(200, "success", orderData)
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

      // validasi - status yang diperbolehkan
      const schema = {
        status: { 
          type: "string", 
          enum: ["unpaid", "paid", "process", "done", "delivered"] 
        }
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

      // Update status order
      await Order.update({ status }, { where: { id } });

      // Ambil updated order dengan items dan menu detail
      const updatedOrder = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ['id', 'name', 'image', 'price']
              }
            ]
          }
        ]
      });

      // Format response dengan items
      const orderData = updatedOrder.toJSON();
      if (orderData.OrderItems) {
        orderData.items = orderData.OrderItems.map(item => ({
          menu_id: item.menu_id,
          menu_name: item.Menu ? item.Menu.name : null,
          name: item.Menu ? item.Menu.name : null,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          image: item.Menu ? item.Menu.image : null
        }));
        delete orderData.OrderItems;
      }

      return res.status(200).json(
        response(200, "order berhasil diupdate", orderData)
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
  },

  // CONFIRM PAYMENT (Customer konfirmasi setelah scan QRIS)
  confirmPayment: async (req, res) => {
    try {

      const { id } = req.params;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json(
          response(404, "order tidak ditemukan")
        );
      }

      // Cek apakah order masih unpaid
      if (order.status !== 'unpaid') {
        return res.status(400).json(
          response(400, `Order sudah dalam status ${order.status}`)
        );
      }

      // Update status menjadi paid
      await Order.update({ status: 'paid' }, { where: { id } });

      // Ambil order dengan items
      const updatedOrder = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Menu,
                attributes: ['id', 'name', 'image', 'price']
              }
            ]
          }
        ]
      });

      // Format response
      const orderData = updatedOrder.toJSON();
      if (orderData.OrderItems) {
        orderData.items = orderData.OrderItems.map(item => ({
          menu_id: item.menu_id,
          menu_name: item.Menu ? item.Menu.name : null,
          name: item.Menu ? item.Menu.name : null,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          image: item.Menu ? item.Menu.image : null
        }));
        delete orderData.OrderItems;
      }

      return res.status(200).json(
        response(200, "pembayaran berhasil dikonfirmasi", orderData)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  }

};
