const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const { User } = require("../models");
const Validator = require("fastest-validator");
const v = new Validator();
const { response } = require("../helpers/response.formatter");
const { auth_secret } = require("../config/base_config");

module.exports = {

  login: async (req, res) => {
    try {

      const { username, password } = req.body;

      // validasi
      const schema = {
        username: { type: "string" },
        password: { type: "string" }
      };

      const validate = v.validate({ username: username, password: password }, schema);

      if (validate.length > 0) {
        return res.status(400).json(
          response(400, "error validasi", validate)
        );
      }

      // ambil data user berdasarkan usernamenya
      const user = await User.findOne({ where: { username: username } });
      if (!user) {
        return res.status(400).json(
          response(400, "User not found")
        );
      }

      // verifikasi password hash
      const verified = passwordHash.verify(password, user.password);
      if (!verified) {
        return res.status(400).json(
          response(400, "Invalid password")
        );
      }

      // membuat token
      const token = jwt.sign({ userId: user.id }, auth_secret, {
        expiresIn: '1h'
      });

      const data = {
        user: {
          name: user.name,
          username: user.username
        },
        token: token
      };

      return res.status(200).json(
        response(200, "loggedin", data)
      );

    } catch (error) {

      return res.status(500).json(
        response(500, "server error", error.message)
      );

    }
  }

};
