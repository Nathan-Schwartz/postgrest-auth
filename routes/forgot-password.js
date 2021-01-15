const config = require("../config/config");
const createToken = require("../src/create-token");
const bcrypt = require("bcryptjs");
const { validate, Joi } = require("express-validation");
const validations = require("../config/validations");
const knex = require("../src/knex");
const transporter = require("../src/transporter");
const express = require("express");

let router = express.Router();

const schema = {
  body: Joi.object({
    username: validations.username.required()
  })
};

router.post("/forgot_password", validate(schema), async function(
  req,
  res,
  next
) {
  try {
    let user = await knex(`${config.db.schema}.${config.db.table}`)
      .where({ username_lowercase: req.body.username.toLowerCase() })
      .first("*");

    if (!user) {
      // Don't allow people to crawl usernames
      return res.status(200).send({ message: "Password reset email sent" });
    }

    let mailOptions = {
      from: `"${config.app_name}" <${config.email.from}>`,
      to: user.email,
      subject: "Password reset ✔",
      text:
        `Your password has been requested to be reset on ${config.app_name}.\n\n` +
        "Use this reset token:\n\n" +
        `${createToken({
          aud: user.username_lowercase,
          count: user.token_count,
          exp: 3600,
          role: user.username_lowercase,
          sub: "reset"
        })}\n\n` +
        "This reset token will expire in 1 hour.\n\n" +
        "If you did not make this request, you can safely ignore this email.\n\n" +
        "A password reset request can be made by anyone, and it does not indicate that your account is in any danger of being accessed by someone else.\n\n" +
        "Thank you for using the site!\n\n" +
        `-${config.app_name} Team\n\n`
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    err.status = 400;
    return next(err);
  }

  return res.status(200).send({ message: "Password reset email sent" });
});

module.exports = router;
