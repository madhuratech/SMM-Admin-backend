const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");


// LOGIN
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // FIXED ADMIN LOGIN
    const ADMIN_EMAIL = "Tikytop@gmail.com";

    const ADMIN_PASSWORD = "Madhura*2026";


    // EMAIL CHECK
    if (email !== ADMIN_EMAIL) {

      return res.status(400).json({
        success: false,
        message: "Invalid Email"
      });

    }


    // PASSWORD CHECK
    if (password !== ADMIN_PASSWORD) {

      return res.status(400).json({
        success: false,
        message: "Invalid Password"
      });

    }


    // TOKEN
    const token = jwt.sign(
      {
        email: ADMIN_EMAIL
      },
      "tikytop_secret_key",
      {
        expiresIn: "7d"
      }
    );


    // SUCCESS
    res.json({

      success: true,

      message: "Login successful",

      token,

      admin: {

        name: "Super Admin",

        email: ADMIN_EMAIL

      }

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

module.exports = router;