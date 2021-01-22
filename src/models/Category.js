const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Category must have an owner"]
    },
    name: {
        type: String,
        required: [true, "Category name is required"]
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }]
}, {
    timestamps: true
});

const CategoryModel = mongoose.model("Task", CategorySchema);

module.exports = CategoryModel;