const TaskController = require('../controllers/TaskController')
const UserController = require('../controllers/UserController')

const taskController = new TaskController()
const userController = new UserController()

module.exports = createRoutes = (app) => {

    //app.get('/task/index', taskController.indexUserTasks)
    //app.post('/task/create', taskController.create)
    //app.post('/task/update', taskController.update)
    //app.delete('/task/delete', taskController.delete)

    app.get('/user/auth', userController.auth)
    app.post('/user/login', userController.login)
    app.delete('/user/logout', userController.logout)

    app.post('/user/register', userController.create)
    app.post('/user/update/username', userController.updateUsername)
    app.delete('/user/delete', userController.delete)

    app.get('/user/verify', userController.verify)
    app.delete('/user/verify', userController.cancelRegistration)

    //app.post('/user/password',userController.requestPasswordChange)
    //app.put('/user/password',userController.changePassword)

}