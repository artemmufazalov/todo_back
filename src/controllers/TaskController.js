const TaskModel = require('../models/Task')
const UserModel = require('../models/User')
const CategoryModel = require('../models/Category')
const {decrypt} = require("../core/crypto")
const {defaultServerError} = require('../utils/helpers/defaultResponses')

class TaskController {

    indexUserTasks = function (req, res) {
        let user = req.user

        UserModel.findById(user._id, {}, {})
            .populate([{path: 'tasksList', select: ['-user',]}, {path: 'categoriesList', select: ['-user', '-tasks']}])
            .exec((err, user) => {
                if (err) {
                    return defaultServerError(res, err)
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
                            messageRus: `Найдено ${user.tasksList.length} задач`,
                            user: user.cleanSensitive(),
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
                            messageRus: "Что-то пошло не так, выберете другое название категории",
                            resultCode: 1
                        })
                } else if (newCatsList.length === 1) {
                    newTaskData.categody = newCatsList[0]._id

                    let newTask = new TaskModel(newTaskData)

                    newTask.save((err, task) => {
                        if (err) {
                            return defaultServerError(res, err)
                        } else {
                            CategoryModel.findById(newCatsList[0]._id, {}, {},
                                (err, category) => {
                                    if (err) {
                                        return defaultServerError(res, err)
                                    } else {
                                        category.tasks.push(task._id)
                                        user.tasksList.push(task._id)
                                        Promise.all([user.save, category.save]).catch((err) => {
                                            return defaultServerError(res, err)
                                        })

                                        return res.status(200)
                                            .json({
                                                message: "New task was added",
                                                messageRus: "Новая задача была добавлена",
                                                task: task.populate([{path: "category"}]),
                                                resultCode: 0
                                            })

                                    }
                                })
                        }
                    })
                } else {
                    return res.status(412)
                        .json({
                            message: "You should create a category first",
                            messageRus: "Для добавления задачи сначала необходимо создать соответствующую категорию",
                            resultCode: 1
                        })
                }
            })
    }

    updateTask = function (req, res) {

        TaskModel.findById(req.body.id, {}, {}, (err, task) => {
            if (!task || err) {
                return res.status(404)
                    .json({
                        message: "Task with this id was not found",
                        messageRus: "Задача с данным id не существует",
                        resultCode: 1
                    })
            } else if (req.body.category && req.body.category !== '') {
                CategoryModel.findOne({user: req.user._id, name: req.body.name}, (err, category) => {
                    if (!category || err) {
                        return res.status(409)
                            .json({
                                message: "Cannot update the task because the chosen category does not exist",
                                messageRus: "Невозможно обновить данные задачи, потому что выбранная категория не существует",
                                resultCode: 1
                            })
                    } else {
                        task.updateTaskData({
                            name: req.body.name,
                            deadlineDate: new Date(req.body.deadlineDate),
                            importance: req.body.importance ? parseInt(req.body.importance) : '',
                            description: req.body.description,
                            isCompleted: req.body.isCompleted,
                            category: category._id
                        }, (err, task) => {
                            if (err) {
                                return defaultServerError(res, err)
                            } else {
                                return res.status(200)
                                    .json({
                                        message: "Task was updated successfully",
                                        messageRus: "Задача успешно обновлена",
                                        task: task,
                                        resultCode: 0
                                    })
                            }
                        })
                    }
                })
            } else {
                task.updateTaskData({
                    name: req.body.name,
                    deadlineDate: new Date(req.body.deadlineDate),
                    importance: req.body.importance ? parseInt(req.body.importance) : '',
                    description: req.body.description,
                    isCompleted: req.body.isCompleted
                }, (err, task) => {
                    if (err) {
                        return defaultServerError(res, err)
                    } else {
                        return res.status(200)
                            .json({
                                message: "Task was updated successfully",
                                messageRus: "Задача успешно обновлена",
                                task: task,
                                resultCode: 0
                            })
                    }
                })
            }
        })
    }

    deleteTask = function (req, res) {
        TaskModel.deleteOne({_id: req.body._id}, (err, task) => {
            if (err) {
                return defaultServerError(res, err)
            } else {
                return res.status(200)
                    .json({
                        message: "Task was deleted successfully",
                        messageRus: "Задача успешно удалена",
                        resultCode: 0
                    })
            }
        })
    }

}

module.exports = TaskController