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

CategorySchema.methods.updateCategoryData = function (newName, newColor, newTaskId, callback) {
    const category = this

    if (newName !== '') {
        category.name = newName
    }
    if (newColor !== '') {
        category.color = newColor
    }
    if (newTaskId !== '') {
        category.tasks.push(newTaskId)
    }

    category.save((err, newCategory) => {
        callback(err, newCategory)
    })
}

const CategoryModel = mongoose.model("Category", CategorySchema);

module.exports = CategoryModel;