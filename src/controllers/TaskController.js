const TaskModel = require('../models/Task')

class TaskController {

    indexUserTasks = (req, res) => {

        TaskModel.find()
            .then((tasksArr) => {
                res.status(200)
                    .json({
                        message: `User has ${tasksArr.length} tasks`,
                        tasksArr: tasksArr
                    })
            })
            .catch((err) => {
                res.status(500)
                    .json({
                        message: "Something went wrong, unable to find tasks of this user",
                        error: err
                    })
            })

    }

    create = (req, res) => {

        console.log(req.body)
        console.log([...req.body.taskDeadline.split('/').map(d => parseInt(d))])

        let dateArr = [...req.body.taskDeadline.split('/').map(d => parseInt(d))]

        const taskData = {
            owner: req.body.ownerID,
            name: req.body.taskName,
            deadline_date: new Date(dateArr[0], dateArr[1] - 1, dateArr[2], dateArr[3], dateArr[4]),
            category: req.body.taskCategory,
            importance: req.body.taskImportance,
            description: req.body.taskDescription,
        }

        const newTask = new TaskModel(taskData)

        newTask.save()
            .then((task) => {
                res.status(200)
                    .json({
                        message: "Task was created successfully",
                        task: task
                    })
            })
            .catch((err) => {
                res.status(500)
                    .json({
                        message: "Something went wrong, unable to save new task",
                        error: err
                    })
            })


    }

    edit = (req, res) => {

    }
}

module.exports = TaskController