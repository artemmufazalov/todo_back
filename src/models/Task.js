const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
        owner: {
            type: String,
            required: [true, "Task must have an owner"]
        },
        name: {
            type: String,
            required: [true, "Task name is required"]
        },
        deadline_date: {
            type: Date,
            required: [true, "Deadline date is required"]
        },
        category: {
            type: String,
            required: [true, "Task category is required"]
        },
        importance: {
            type: Number,
            required: [true, "Importance value is required"],
            validate: (val) => {
                return [1, 2, 3, 4, 5].includes(val)
            }
        },
        description: {
            type: String,
            required: false
        },
        is_completed: {
            type: Boolean,
            default: false,
            required: true
        },
        date_completed: {
            type: Date
        },
    },
    {
        timestamps: true
    });


const TaskModel = mongoose.model("Task", TaskSchema);

module.exports = TaskModel;