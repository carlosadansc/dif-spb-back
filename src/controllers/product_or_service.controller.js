const ProductOrServiceModel = require('../models/product_or_service.model');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')
const GetDate = require('../utils/GetDate')

// CREATE productOrService
exports.create = (req, res) => {
    const createdBy = tokenUtils.decodeToken(req.headers['authorization']).id;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const { category, name, description, approxPrice } = req.body;

    const productOrService = new ProductOrServiceModel({
        category,
        name,
        description,
        approxPrice,
        createdBy,
        createdAt: GetDate.date(),
    });
    productOrService
        .save()
        .then(() => {
            // **** LOG **** //
            logger.log('POST', '/product-or-service/create', currentuser);
            res.status(httpStatus.OK).json({ data: productOrService, errors: [], })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('POST', '/product-or-service/create', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};

// UPDATE productOrService
exports.update = (req, res) => {
    const { id } = req.params;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const { category, name, description, approxPrice } = req.body;
    const updatedBy = tokenUtils.decodeToken(req.headers['authorization']).id;
    ProductOrServiceModel.findByIdAndUpdate(id, { $set: { category, name, description, approxPrice, updatedBy, updatedAt: GetDate.date() } })
        .then((productOrService) => {
            // **** LOG **** //
            logger.log('PUT', `/product-or-service/update/${id}`, currentuser);
            res.status(httpStatus.OK).json({ data: productOrService, errors: [] });
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('PUT', `/product-or-service/update/${id}`, currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
}

// GET all product or services
exports.getAllProductOrServices = (req, res) => {
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    ProductOrServiceModel.find()
        .then((productOrServices) => {
            // **** LOG **** //
            logger.log('GET', '/product-or-service/all', currentuser);
            res.status(httpStatus.OK).json({ data: productOrServices, errors: [] });
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('GET', '/product-or-service/all', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};

// GET product or service by id
exports.getProductOrServiceById = (req, res) => {
    const { id } = req.params;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    ProductOrServiceModel.findById(id)
        .then((productOrService) => {
            // **** LOG **** //
            logger.log('GET', `/product-or-service/${id}`, currentuser);
            res.status(httpStatus.OK).json({ data: productOrService, errors: [] });
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('GET', `/product-or-service/${id}`, currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};

// REMOVE product or service by id
exports.removeProductOrServiceById = (req, res) => {
    const { id } = req.params;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    ProductOrServiceModel.findByIdAndDelete(id)
        .then((productOrService) => {
            // **** LOG **** //
            logger.log('DELETE', `/product-or-service/${id}`, currentuser);
            res.status(httpStatus.OK).json({ data: productOrService, errors: [] });
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('DELETE', `/product-or-service/${id}`, currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};

// GET product or service by category
exports.getByCategory = async (req, res) => { 

    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username; 
    const category = req.query.category; 
    if (!category) { 
        return res.status(httpStatus.BAD_REQUEST).send({ data: {}, errors: ["La categoría es requerida"] }); 
    } 
    await ProductOrServiceModel.find({ category: category }).then((productOrServices) => {
        // **** LOG **** //
        logger.log('GET', '/product-or-service/by-category?category=' + category, currentuser);
        res.status(httpStatus.OK).json({ data: productOrServices, errors: [] });

    }).catch((err) => {
        // **** LOG **** //
        console.log(err);
        logger.log('GET', '/product-or-service/by-category/', currentuser, err, false);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000] });
})};
