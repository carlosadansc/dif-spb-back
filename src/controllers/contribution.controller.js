const Contribution = require("../models/contribution.model");
const ContributionItem = require("../models/contribution_item.model");
const Beneficiary = require("../models/beneficiary.model");
const tokenUtils = require("../utils/TokenUtils");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");

// CREATE contribution
// exports.create = async (req, res) => {
//   const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
//   const currentuser = tokenUtils.decodeToken( req.headers["authorization"] ).username;
//   const { contributionItems, beneficiary, comments, contributionDate } = req.body;

//   const contribution = new Contribution({
//     contributionItems,
//     beneficiary,
//     comments,
//     contributionDate,
//     createdBy,
//     createdAt: new Date(),
//   });
//   await contribution
//     .save()
//     .then(async () => {
//       // **** LOG **** //
//       const foundBeneficiary = await Beneficiary.findById(beneficiary);
//       foundBeneficiary.contributions.push(contribution._id);
//       await Beneficiary.findOneAndUpdate(
//         { _id: beneficiary },
//         { contributions: foundBeneficiary.contributions }
//       );
//       logger.log("POST", "/contribution/create", currentuser);
//       res.status(httpStatus.OK).json({ data: contribution, errors: [] });
//     })
//     .catch((err) => {
//       // **** LOG **** //
//       logger.log("POST", "/contribution/create", currentuser, err, false);
//       return res
//         .status(httpStatus.INTERNAL_SERVER_ERROR)
//         .send({ data: {}, errors: [errorCode.ERR0000] });
//     });
// };

exports.create = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { id: createdBy, username: currentuser } =
      tokenUtils.decodeToken(authorization);
    const { contributionItems, beneficiary, comments, contributionDate } =
      req.body;

    const contribution = new Contribution({
      contributionItems,
      beneficiary,
      comments,
      contributionDate,
      createdBy,
      createdAt: new Date(),
    });

    await contribution.save();

    // **** LOG **** //
    const foundBeneficiary = await Beneficiary.findById(beneficiary);
    foundBeneficiary.contributions.push(contribution._id);
    await Beneficiary.findByIdAndUpdate(beneficiary, {
      contributions: foundBeneficiary.contributions,
    });

    logger.log("POST", "/contribution/create", currentuser);
    res.status(httpStatus.OK).json({ data: contribution, errors: [] });
  } catch (err) {
    // **** LOG **** //
    logger.log("POST", "/contribution/create", currentuser, err, false);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ data: {}, errors: [errorCode.ERR0000] });
  }
};

// GET contribution by Beneficiary
exports.getContributionByBeneficiary = (req, res) => {
  const { beneficiary } = req.params;
  const currentuser = tokenUtils.decodeToken( req.headers["authorization"]).username;
  Contribution.find({ beneficiary: beneficiary })
    .then((contributions) => {
      // **** LOG **** //
      logger.log("GET", `/contribution/${beneficiary}`, currentuser);
      res.status(httpStatus.OK).send({ data: contributions, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("GET", `/contribution/${beneficiary}`, currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
    });
};

// GET all contributions with catergory
exports.getContributionsWhitCategory = async (req, res) => {
  const currentuser = tokenUtils.decodeToken( req.headers["authorization"]).username;
  try {
    const contributions = await Contribution.aggregate([
      { $unwind: "$contributionItems" },
      {
        $lookup: {
          from: "contributionitems",
          localField: "contributionItems.contributionItem",
          foreignField: "_id",
          as: "contributionItemDetails",
        },
      },
      { $unwind: "$contributionItemDetails" },
      {
        $group: {
          _id: "$contributionItemDetails.category",
          totalQuantity: { $sum: "$contributionItems.quantity" },
          contributions: { $push: "$$ROOT" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

     // **** LOG **** //
     logger.log("GET", `/contribution/categories`, currentuser);
     res.status(httpStatus.OK).send({ data: contributions, errors: [] });
  } catch (err) {
     // **** LOG **** //
     logger.log("GET", `/contribution/categories`, currentuser, err, false);
     return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
  }
};
