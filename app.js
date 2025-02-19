var _ = require("lodash");
var cors = require('cors');
var express = require("express");
const { ValidationError } = require("express-validation");
var logger = require("morgan");
var bodyParser = require("body-parser");
var bearerToken = require("express-bearer-token");
var HttpStatus = require("http-status-codes");

var app = express();

app.options('*', cors()) // include before other routes
app.use(cors());
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bearerToken());

app.use("/auth", require("./routes/change-email"));
app.use("/auth", require("./routes/change-password"));
app.use("/auth", require("./routes/forgot-password"));
app.use("/auth", require("./routes/forgot-username"));
app.use("/auth", require("./routes/refresh-token"));
app.use("/auth", require("./routes/users"));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;

  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err);
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err)
  }

  err.status = err.status || 500;
  err.statusText = err.statusText || HttpStatus.getStatusText(err.status);
  err.message = err.message || "Sorry about this";

  // set locals, only providing error in development
  res.status(err.status);
  res.locals.message = err.message;

  if (process.env.NODE_ENV === "production") {
    res.locals.error = {};
    res.send(_.pick(err, ["status", "statusText", "errors"]));
  } else {
    res.locals.error = err;
    res.send(err);
  }
});

module.exports = app;
