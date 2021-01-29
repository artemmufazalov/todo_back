const TaskModel = require('../models/Task')
const UserModel = require('../models/User')
const CategoryModel = require('../models/Category')
const {decrypt} = require("../core/crypto")

//TODO: update, methods: create, delete, edit, index

const defaultServerError = (res, err) => {
    return res.status(200)
        .json({
            message: "Some error occurred",
            error: err,
            resultCode: 1
        })
}

class TaskController {

    indexUserTasks = function (req, res) {
        let user = req.user

        UserModel.findById(user._id, {}, {})
            .select(['-_id', '-password', '-confirmationToken', '-authTokens', '-passwordResetToken'])
            .populate([{path: 'tasksList', select: ['-user',]}, {path: 'categoriesList', select: ['-user', '-tasks']}])
            .exec((err, user) => {
                if (err) {
                    return res.status(500)
                        .json({
                            message: "Some error occurred",
                            error: err,
                            resultCode: 1
                        })
                } else {
                    if (user.tasksList.length > 0) {
                        user.tasksList.forEach(task => {
                            task.name = decrypt(task.name)
                            task.description = decrypt(task.description)
                        })
                    }

                    return res.status(200)
                        .json({
                            message: `Found ${user.tasksList.length} tasks`,
                            user: user,
                            resultCode: 0
                        })
                }
            })
    }

    createCategory = function (req, res) {
        const newCatData = {
            name: req.body.name,
            color: req.body.color,
            user: req.user._id
        }

        CategoryModel.findOne({name: req.body.name, user: req.user._id}, (err, existingCat) => {
            if (!existingCat || err) {
                let newCategory = new CategoryModel(newCatData)
                newCategory.save()
                    .then((category) => {
                        return res.status(200)
                            .json({
                                message: "New category was created successfully",
                                category: category.select('-user'),
                                resultCode: 0
                            })
                    })
                    .catch((err) => {
                        return res.status(500)
                            .json({
                                message: "Some error occurred",
                                error: err,
                                resultCode: 1
                            })
                    })
            } else {
                return res.status(409)
                    .json({
                        message: "Category with this name already exists",
                        category: existingCat.select('-user'),
                        resultCode: 0
                    })
            }
        })
    }

    create = function (req, res) {

        let newTaskData = {
            user: req.user._id,
            name: req.body.name,
            deadlineDate: new Date(req.body.deadlineDate),
            importance: req.body.importance,
            description: req.body.description,
        }

        UserModel.findById(req.user._id)
            .select(['-password', '-confirmationToken', '-authTokens', '-passwordResetToken'])
            .populate({path: 'categoriesList', select: ['-user', '-tasks']})
            .exec((err, user) => {

                let newCatsList = user.categoriesList.filter(category => category.name === req.body.category)

                if (newCatsList.length > 1) {
                    return res.status(409)
                        .json({
                            message: "Something went wrong, select different category name",
                            resultCode: 1
                        })
                } else if (newCatsList.length === 1) {
                    newTaskData.categody = newCatsList[0]._id

                    let newTask = new TaskModel(newTaskData)

                    newTask.save()
                        .then((task) => {

                            CategoryModel.findById(newCatsList[0]._id)
                                .then((category) => {
                                    category.tasks.push(task._id)
                                    user.tasksList.push(task._id)

                                    Promise.all([user.save, category.save]).catch((err) => {
                                        return defaultServerError(res, err)
                                    })
                                })
                                .catch((err) => {
                                    return defaultServerError(res, err)
                                })

                            return res.status(200)
                                .json({
                                    message: "New task was added",
                                    task: task.populate([{path: "category"}]),
                                    resultCode: 0
                                })
                        })
                        .catch((err) => {
                            return defaultServerError(res, err)
                        })

                } else {
                    return res.status(412)
                        .json({
                            message: "You should create a category first",
                            resultCode: 1
                        })
                }
            })
    }

}

module.exports = TaskController