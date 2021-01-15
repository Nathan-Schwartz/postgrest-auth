const config = require("../config/config");
const bcrypt = require("bcryptjs");
const { validate, Joi } = require("express-validation");
const validations = require("../config/validations");
const knex = require("../src/knex");
const express = require("express");
const transporter = require("../src/transporter");

let router = express.Router();

const schema = {
  body: Joi.object({
    email: validations.email.required()
  })
};

router.post("/forgot_username", validate(schema), async function(
  req,
  res,
  next
) {
  try {
    let user = await knex(`${config.db.schema}.${config.db.table}`)
      .where({ email: req.body.email.toLowerCase() })
      .first("*");

    if (!user) {
      // Don't allow people to crawl emails
      return res.status(200).send({
        message: "Username Email sent"
      });
    }


    let mailOptions = {
      from: `"${config.app_name}" <${config.email.from}>`,
      to: user.email,
      subject: "Forgot username ✔",
      text:
        `Your username has been requested for ${config.app_name}: ${user.username}\n\n` +
        "If you did not make this request, you can safely ignore this email.\n\n" +
        "A username request can be made by anyone, and it does not indicate that your account is in any danger of being accessed by someone else.\n\n" +
        "Thank you for using the site!\n\n" +
        `-${config.app_name} Team`
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    err.status = 400;
    return next(err);
  }

  return res.status(200).send({
    message: "Username Email sent"
  });
});

module.exports = router;
