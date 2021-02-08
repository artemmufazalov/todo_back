const TaskController = require('../controllers/TaskController')
const UserController = require('../controllers/UserController')
const CategoryController = require('../controllers/CategoryController')

const taskController = new TaskController()
const userController = new UserController()
const categoryController = new CategoryController()

module.exports = createRoutes = (app) => {

    //Tasks
    app.get('/task/index', taskController.indexUserTasks)
    app.post('/task/create', taskController.create)
    app.post('/task/update', taskController.updateTask)
    app.post('/task/delete', taskController.deleteTask)

    //Categories
    app.get('/category/index', categoryController.indexCategories)
    app.post('/category/create', categoryController.createCategory)
    app.post('category/update', categoryController.updateCategory)
    app.post('/category/delete', categoryController.deleteCategory)

    //User
    app.get('/user/auth', userController.auth)
    app.post('/user/login', userController.login)
    app.delete('/user/logout', userController.logout)

    app.post('/user/register', userController.create)
    app.post('/user/update/username', userController.updateUsername)
    app.delete('/user/delete', userController.delete)

    app.get('/user/verify', userController.verify)
    app.delete('/user/verify', userController.cancelRegistration)

    //app.post('/user/password/change',userController.requestPasswordChange) //request change from profile page
    //app.post('/user/password/restore', userController.requestPasswordRestore) //request change from login from
    //app.put('/user/password/update',userController.changePassword) //update password


}