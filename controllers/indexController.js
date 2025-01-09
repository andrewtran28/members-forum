const asyncHandler = require("express-async-handler");
// const query = require("../db/queries.js");

const getIndex = asyncHandler(async (req, res) => {
  res.render("index", { title: "Message Forum" });
  res.end();
});

module.exports = { getIndex };
