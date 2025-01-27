const ContributionItemCategory = require('../models/contribution_item_category.model')
const tokenUtils = require("../utils/TokenUtils");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");


// CREATE contribution item category


// GET contribution item categories
exports.getAllCategories = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  ContributionItemCategory.find()
    .then((contributionItemCategories) => {
      // **** LOG **** //
      logger.log("GET", "/contribution-item-categories", currentuser);
      res.status(httpStatus.OK).send({ data: contributionItemCategories, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("GET", "/contribution-item-categories", currentuser, err, false);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ data: {}, errors: [errorCode.ERR0000, err] });
    });
};