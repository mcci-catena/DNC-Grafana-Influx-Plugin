const mongoose = require('mongoose');

const NoteSchema = mongoose.Schema({
    cname: String,
    cid: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Country', NoteSchema);