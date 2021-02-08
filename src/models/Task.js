const mongoose = require('mongoose')

const {encrypt} = require("../core/crypto");

const TaskSchema = new mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Task must have an owner"]
        },
        name: {
            type: String,
            required: [true, "Task name is required"]
        },
        deadlineDate: {
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
        isCompleted: {
            type: Boolean,
            default: false,
            required: true
        },
        dateCompleted: {
            type: Date
        },
    },
    {
        timestamps: true
    });

TaskSchema.pre('save', function (next) {
    const task = this;

    if (task.isModified('name')) {
        task.name = encrypt(task.name);
    }
    if (task.isModified('description')) {
        task.description = encrypt(task.description);
    }

    next();
});

TaskSchema.methods.updateTaskData = function (inputValues, callback) {
    let task = this

    if (!task.isCompleted && inputValues.isCompleted) {
        task.isCompleted = true
        task.dateCompleted = new Date()
    }

    Object.keys(inputValues).forEach(value => {
        if (Object.keys(task).includes(value) && inputValues[value] && inputValues[value] !== ''){
            task[value] = inputValues[value]
        }
    })

    task.save((err, task) => {
        callback(err, task)
    })
}

const TaskModel = mongoose.model("Task", TaskSchema);

module.exports = TaskModel;