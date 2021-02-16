const CategoryModel = require('../models/Category')
const {defaultServerError} = require('../utils/helpers/defaultResponses')
const {cleanObjectFields} = require("../utils/helpers/cleanObjectFields")

class CategoryController {

    indexCategories (req, res) {
        const userId = req.user._id

        CategoryModel.find({user: userId}, (err, categories) => {
            if (!categories) {
                return res.status(404)
                    .json({
                        message: "Categories were not found",
                        messageRus: "Не было найдено ни одной созданной категории",
                        resultCode: 1
                    })
            } else if (err) {
                return defaultServerError(res, err)
            } else {
                return res.status(200)
                    .json({
                        message: `Found ${categories.length} categories`,
                        messageRus: `Найдено ${categories.length} категорий`,
                        categories: categories,
                        resultCode: 0
                    })
            }
        })
    }

    createCategory (req, res) {
        let user = req.user

        const newCatData = {
            name: req.body.name,
            color: req.body.color,
            user: user._id
        }

        CategoryModel.findOne({name: req.body.name, user: user._id}, (err, existingCat) => {
            if (!existingCat || err) {
                let newCategory = new CategoryModel(newCatData)
                newCategory.save()
                    .then((category) => {
                        user.categoriesList.push(category._id)
                        user.save()

                        return res.status(200)
                            .json({
                                message: "New category was created successfully",
                                messageRus: "Новая категория была успешно создана",
                                category: cleanObjectFields(category, ['user', 'tasks']),
                                resultCode: 0
                            })
                    })
                    .catch((err) => {
                        return defaultServerError(res, err)
                    })
            } else {
                return res.status(409)
                    .json({
                        message: "Category with this name already exists",
                        messageRus: "Категория с таким именем уже существует",
                        category: cleanObjectFields(existingCat, ['user', 'tasks']),
                        resultCode: 1
                    })
            }
        })
    }

    updateCategory (req, res) {
        const newCatData = {
            newName: req.body.name,
            newColor: req.body.color
        }

        CategoryModel.findOne({user: req.user._id, name: req.body.name}, (err, category) => {
            if (!category) {
                return res.status(404)
                    .json({
                        message: "Category with this name does not exist",
                        messageRus: "Категории с данным именем не существует",
                        resultCode: 1
                    })
            } else if (err) {
                return defaultServerError(res, err)
            } else {
                category.updateCategoryData(newCatData.newName, newCatData.newColor, '', (err, newCategory) => {
                    if (err) {
                        return defaultServerError(res, err)
                    } else {
                        return res.status(200)
                            .json({
                                message: "Category was updated successfully",
                                messageRus: "Категория была успешно обновлена",
                                category: newCategory,
                                resultCode: 0
                            })
                    }
                })

            }
        })
    }

    deleteCategory (req, res) {
        CategoryModel.deleteOne({user: req.user._id, name: req.body.name}, (err, category) => {
            if (!category) {
                return res.status(404)
                    .json({
                        message: "Category with this name does not exist",
                        messageRus: "Категории с данным именем не существует",
                        resultCode: 1
                    })
            } else if (err) {
                return defaultServerError(res, err)
            } else {
                return res.status(200)
                    .json({
                        message: "Category was deleted successfully",
                        messageRus: "Категория была успешно удалена",
                        resultCode: 0
                    })
            }
        })
    }

}

module.exports = CategoryController