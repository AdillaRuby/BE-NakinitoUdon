const Validator = require("fastest-validator");
const v = new Validator();

const { response } = require("../helpers/response.formatter");
const { Transaction, Order, OrderItem } = require("../models");
const { Op } = require("sequelize");

module.exports = {

  // CREATE TRANSACTION
  createTransaction: async (req, res) => {
    try {

      const { order_id, payment_method, money_received } = req.body;

      // validasi data
      const schema = {
        order_id: { type: "number", positive: true },
        payment_method: { type: "string", min: 3 },
        money_received: { type: "number", positive: true, integer: true }
      };

      const data = {
        order_id: Number(order_id),
        payment_method: payment_method,
        money_received: Number(money_received)
      };

      const validate = v.validate(data, schema);

      if (validate.length > 0) {
        return res.status(400).json(
          response(400, "error validasi", validate)
        );
      }

      // jika id order tidak ada
      const order = await Order.findByPk(order_id);
      if (!order) {
        return res.status(400).json(
          response(400, "Order not found")
        );
      }

      // cek jika uang yang diterima kurang dari total harga
      if (data.money_received < order.total_price) {
        return res.status(400).json(
          response(400, "Uang yang diterima kurang dari total harga. Total: " + order.total_price)
        );
      }

      // hitung kembalian
      const change_money = data.money_received - order.total_price;

      // buat transaksi
      const transaction = await Transaction.create({
        order_id: data.order_id,
        payment_method: data.payment_method,
        total_payment: order.total_price,
        money_received: data.money_received,
        change_money: change_money,
        status: "paid"
      });

      // update status order menjadi done
      await Order.update({
        status: "done"
      }, {
        where: { id: order_id }
      });

      // ambil data transaksi beserta order-nya
      const transactionCreated = await Transaction.findByPk(transaction.id, {
        include: [{ model: Order }]
      });

      return res.status(201).json(
        response(201, "transaksi berhasil dibuat", transactionCreated)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  },

  // GET ALL TRANSACTION
  getTransaction: async (req, res) => {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 5;
      const offset = (page - 1) * limit;

      const { count, rows } = await Transaction.findAndCountAll({
        offset: offset,
        limit: limit,
        include: [{ model: Order }]
      });

      const formatPagination = {
        data: rows,
        limit: limit,
        rangeData: (offset + 1) + "~" + (offset + rows.length),
        currentPage: page,
        totalPage: Math.round(count / limit),
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

  // GET DETAIL TRANSACTION
  showTransaction: async (req, res) => {
    try {

      const { id } = req.params;

      const transaction = await Transaction.findByPk(id, {
        include: [{ model: Order }]
      });

      if (!transaction) {
        return res.status(404).json(
          response(404, "transaksi tidak ditemukan")
        );
      }

      return res.status(200).json(
        response(200, "success", transaction)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  }

};
