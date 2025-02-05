const Contribution = require("../models/contribution.model");
const ContributionItem = require('../models/contribution_item.model');
const Beneficiary = require("../models/beneficiary.model");
const mongoose = require('mongoose');
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
    const { contributionItems, beneficiary, comments, contributionDate, receiver } =
      req.body;

    const contribution = new Contribution({
      contributionItems,
      beneficiary,
      comments,
      contributionDate,
      receiver,
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
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  Contribution.find({ beneficiary: beneficiary })
    .then((contributions) => {
      // **** LOG **** //
      logger.log("GET", `/contribution/${beneficiary}`, currentuser);
      res.status(httpStatus.OK).send({ data: contributions, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log(
        "GET",
        `/contribution/${beneficiary}`,
        currentuser,
        err,
        false
      );
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ data: {}, errors: [errorCode.ERR0000, err] });
    });
};

// GET all contributions with catergory
exports.getContributionsWithCategory = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
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
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ data: {}, errors: [errorCode.ERR0000, err] });
  }
};

// GET all years
exports.getContributionYears = (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  Contribution.aggregate([
    { $group: { _id: { $year: "$contributionDate" } } },
    { $sort: { _id: -1 } },
  ])
    .exec()
    .then((years) => {
      // **** LOG **** //
      logger.log("GET", "/contribution/years", currentuser);
      res.status(httpStatus.OK).json({ data: years, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("GET", "/contribution/years", currentuser, err, false);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ data: {}, errors: [errorCode.ERR0000] });
    });
};

// GET summary of contributions by year and month
exports.getContributionSummaryByCategory = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;

  const { year, month } = req.query; // Obtener los parámetros de año y mes de la consulta
  const matchConditions = {};

  if (year) {
    const startDate = new Date(year, month ? month - 1 : 0, 1);
    const endDate = new Date(year, month ? month : 12, 0, 23, 59, 59, 999);
    matchConditions.contributionDate = { $gte: startDate, $lte: endDate };
  }

  try {
    const categoryTotals = await Contribution.aggregate([
      { $unwind: "$contributionItems" },
      {
        $lookup: {
          from: "contributionitems", // La colección de items de contribución
          localField: "contributionItems.contributionItem",
          foreignField: "_id",
          as: "contributionItemDetails",
        },
      },
      { $unwind: "$contributionItemDetails" },
      {
        $lookup: {
          from: "contributionitemcategories", // La colección de categorías de contribución
          localField: "contributionItemDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      { $match: matchConditions },
      {
        $group: {
          _id: "$categoryDetails.name", // Agrupar por nombre de categoría
          totalQuantity: { $sum: "$contributionItems.quantity" }, // Sumar la cantidad de ítems por categoría,
          categoryColor: { $first: "$categoryDetails.color" }, // Obtener el color de la categoría
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalQuantity: 1,
          categoryColor: "$categoryColor",
        },
      },
    ]);
    // **** LOG **** //
    logger.log(
      "GET",
      `/contribution/summary-by-category?month=${month}?year=${year}`,
      currentuser
    );
    res.status(httpStatus.OK).json({ data: categoryTotals, errors: [] });
  } catch (error) {
    // **** LOG **** //
    // **** LOG **** //
    logger.log(
      "GET",
      `/contribution/summary-by-category?month=${month}?year=${year}`,
      currentuser,
      err,
      false
    );
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ data: {}, errors: [errorCode.ERR0000] });
  }
};

//Get summary of contribution Items by category, year and month
exports.getContributionItemSummaryByCategory = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { category, year, month } = req.query;

  try {
        // Construimos el filtro dinámicamente según los parámetros proporcionados
        let filter = {};

        // Filtro por fecha
        if (year && month) {
          const startDate = new Date(year, month - 1, 1); // Primer día del mes
          const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Último día del mes
          filter.contributionDate = { $gte: startDate, $lte: endDate };
        } else if (year) {
          const startDate = new Date(year, 0, 1); // Primer día del año
          const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // Último día del año
          filter.contributionDate = { $gte: startDate, $lte: endDate };
        }
    
        // Obtener las contribuciones según el filtro
        const contributions = await Contribution.find(filter)
          .populate({
            path: 'contributionItems.contributionItem',
            populate: { path: 'category', model: 'ContributionItemCategory' }
          });
    
        // Crear un mapa para acumular los totales por ContributionItem
        const totalsByItem = {};
    
        contributions.forEach(contribution => {
          contribution.contributionItems.forEach(item => {
            // Filtrar por categoría si se proporciona
            if (category && item.contributionItem.category._id.toString() !== category) return;
    
            const itemId = item.contributionItem._id.toString();
            const itemDescription = item.contributionItem.description;
    
            if (!totalsByItem[itemId]) {
              totalsByItem[itemId] = {
                contributionItemId: itemId,
                description: itemDescription,
                totalQuantity: 0
              };
            }
            totalsByItem[itemId].totalQuantity += item.quantity;
          });
        });
    
        // Convertir el mapa a un array para la respuesta
        const totalsArray = Object.values(totalsByItem);
    // **** LOG **** //
    logger.log("GET", `/contribution/contribution-item-summary-by-category?category=${category}&month=${month}&year=${year}`,currentuser);
    res.status(httpStatus.OK).json({ data: totalsArray, errors: [] })

  } catch (error) {
    // **** LOG **** //
    logger.log("GET", `/contribution/contribution-item-summary-by-category?category=${category}&month=${month}&year=${year}`,currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000]});
  }
}