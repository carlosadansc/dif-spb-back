const ContributionItem = require('../models/contribution_item.model');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')

// CREATE contributionItem
exports.create = (req, res) => {
    const createdBy = tokenUtils.decodeToken(req.headers['authorization']).id;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const { category, description, approxPrice } = req.body;

    const contributionItem = new ContributionItem({
        category,
        description,
        approxPrice,
        createdBy,
        createdAt: new Date(),
    });
    contributionItem
        .save()
        .then(() => {
            // **** LOG **** //
            logger.log('POST', '/contribution-item/create', currentuser);
            res.status(httpStatus.OK).json({ data: contributionItem, errors: [], })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('POST', '/contribution-item/create', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};

// GET contributionsByType
exports.getContributionsByCategory = (req, res) => {
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    ContributionItem.find({ category: req.query.category })
        .then((contributionItems) => {
            // **** LOG **** //
            logger.log('GET', '/contribution-item/by-category?' + req.query.category, currentuser);
            res.status(httpStatus.OK).json({ data: contributionItems, errors: [] })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('GET', '/contribution-item/by-category/', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};