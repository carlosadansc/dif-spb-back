const CategoryModel = require('../models/category.model')
const ProductOrServiceModel = require('../models/product_or_service.model')
const tokenUtils = require("../utils/TokenUtils");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");
const GetDate = require("../utils/GetDate");

// CREATE category
exports.create = (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { productOrServices,name, label, description, color } = req.body;
  const category = new CategoryModel({
    name,
    label,
    description,
    color,
    productOrServices,
    createdBy,
    createdAt: GetDate.date(),
  });
  category
    .save()
    .then(() => {
      // **** LOG **** //
      logger.log("POST", "/category/create", currentuser);
      res.status(httpStatus.OK).json({ data: category, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("POST", "/category/create", currentuser, err, false);
      return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
    });
};

//UPDATE category
exports.update = (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { name, label, description, color, productOrServices } = req.body;
  const updatedBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  CategoryModel.findByIdAndUpdate(id, { $set: { name, label, description, color, productOrServices, updatedBy, updatedAt: GetDate.date() } })
    .then((category) => {
      // **** LOG **** //
      logger.log("PUT", `/category/update/${id}`, currentuser);
      res.status(httpStatus.OK).json({ data: category, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("PUT", `/category/update/${id}`, currentuser, err, false);
      return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
    });
}

// CREATE product or service and add to category
exports.createProductOrService = async (req, res) => {
  try {
    const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
    const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
    const { category, name, description } = req.body;

    // Check if category exists
    const foundCategory = await CategoryModel.findById(category);
    if (!foundCategory) {
      return res.status(httpStatus.NOT_FOUND).send({ 
        data: {}, 
        errors: [errorCode.ERR0001] 
      });
    }

    // Create new product or service
    const productOrService = new ProductOrServiceModel({
      category,
      name,
      description,
      createdBy,
      createdAt: GetDate.date()
    });

    const savedProductOrService = await productOrService.save();

    // Add product/service to category
    await CategoryModel.findByIdAndUpdate(
      category, 
      { $push: { productOrServices: savedProductOrService._id } },
      { new: true }
    );

    logger.log("POST", "/category/create-product-or-service", currentuser);
    return res.status(httpStatus.OK).send({ 
      data: savedProductOrService, 
      errors: [] 
    });

  } catch (err) {
    logger.log("POST", "/category/create-product-or-service", currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      data: {}, 
      errors: [errorCode.ERR0000, err] 
    });
  }
};

// GET categories
exports.getAllCategories = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  CategoryModel.find()
    .then((categories) => {
      // **** LOG **** //
      logger.log("GET", "/categories", currentuser);
      res.status(httpStatus.OK).send({ data: categories, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("GET", "/categories", currentuser, err, false);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ data: {}, errors: [errorCode.ERR0000, err] });
    });
};