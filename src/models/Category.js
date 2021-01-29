const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Category must have an owner"]
    },
    name: {
        type: String,
        required: [true, "Category name is required"]
    },
    color: {
        type: String,
        required: true
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }]
}, {
    timestamps: true
});

const CategoryModel = mongoose.model("Category", CategorySchema);

module.exports = CategoryModel;