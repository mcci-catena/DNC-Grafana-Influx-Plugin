const mongoose = require('mongoose');

const NoteSchema = mongoose.Schema({
    latitude: String,
    longitude: String,
    state: String,
    city: String,
    ward: String,
    street: String,
    location: String,
    devname: String,
    devid: String,
    idate: Date,
    rdate: Date
}, {
    timestamps: true
});

module.exports = NoteSchema;