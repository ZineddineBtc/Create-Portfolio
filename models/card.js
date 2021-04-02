const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
    userID: String,
    section: String,
    title: String,
    description: String,
    datetime: String,
    url: String
});


module.exports = mongoose.model("Card", CardSchema);