const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
        select: false
    }

});

userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
};

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAuthToken = function() {

    const token = jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
    );

    return token;
};

module.exports = mongoose.model("User", userSchema);