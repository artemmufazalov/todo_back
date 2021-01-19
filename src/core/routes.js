const TaskController = require('../controllers/TaskController')

const taskController = new TaskController()

module.exports = createRoutes = (app) => {
    app.get('/tasks', taskController.indexUserTasks)

    app.post('/tasks', taskController.create)

}