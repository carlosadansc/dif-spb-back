const Beneficiary = require("../models/beneficiary.model");
const Families = require("../models/family.model");
const tokenUtils = require("../utils/TokenUtils");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");

// CREATE benenficiary
exports.create = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  const {
    name,
    fatherSurname,
    motherSurname,
    age,
    birthdate,
    birthplace,
    sex,
    curp,
    phone,
    hasDisability,
    disabilityType,
    medicalService,
    civilStatus,
    scholarship,
    income,
    address,
    spouseOrTutor,
    home,
    expenses,
    families,
  } = req.body;

  const insertFamilies = [];
  const newFamilies = [];
  if (families) {
    insertFamilies = families.map((family) => {
      return {
        ...family,
        createdBy,
        createdAt: new Date(),
      };
    });
    // Inserting Sample Famlies Documents
    newFamilies = await Families.insertMany(insertFamilies);
  }

  // Creating an array of Insurance IDs
  const familiesIds = newFamilies.map((family) => family._id);

  const beneficiary = new Beneficiary({
    name,
    fatherSurname,
    motherSurname,
    age,
    birthdate,
    birthplace,
    sex,
    curp,
    phone,
    hasDisability,
    disabilityType,
    medicalService,
    civilStatus,
    scholarship,
    income,
    address,
    spouseOrTutor,
    home,
    expenses,
    families: familiesIds,
    createdBy,
    createdAt: new Date(),
  });

  await beneficiary
    .save()
    .then(() => {
      // **** LOG **** //
      logger.log("POST", "/beneficiaries/create", currentuser);
      res
        .status(httpStatus.OK)
        .json({ data: { beneficiary: beneficiary }, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("POST", "/beneficiaries/create", currentuser, err, false);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({
          data: {},
          errors: [err.code == 11000 ? errorCode.ERR0007 : errorCode.ERR0000],
        });
    });
};

// UPDATE beneficiary
exports.update = (req, res) => {
  const updatedBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { filter, update } = req.body;
  console.log(filter, update);
  const beneficiary = {
    ...update,
    updatedBy,
    updatedAt: new Date(),
  };
  Beneficiary.findOneAndUpdate(filter, beneficiary)
    .then((beneficiary) => {
      // **** LOG **** //
      logger.log("PUT", `/beneficiary/update/${beneficiary._id}`, currentuser);
      res.status(httpStatus.OK).send({ data: beneficiary, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log(
        "PUT",`/beneficiary/update/${beneficiary._id}`,currentuser,err,false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
    });
};

// GET simple data user by id
exports.getBeneficiaryById = (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken( req.headers["authorization"] ).username;
  Beneficiary.findById(id)
    .then((beneficiary) => {
      if (beneficiary) {
        // **** LOG **** //
        logger.log("GET", `/beneficiary/${id}`, currentuser);
        res.status(httpStatus.OK).send({ data: beneficiary, errors: [] });
      } else {
        logger.log("GET", `/beneficiary/${id}`, currentuser, errorCode.ERR0001.title, false);
        return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001] });
      }
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("GET", `/beneficiary/${id}`, currentuser, err, false);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ data: {}, errors: [errorCode.ERR0000, err] });
    });
};

// GET beneficiaries
// exports.getBeneficiaries = (req, res) => {
//   const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
//   Beneficiary.find()
//     .then((beneficiaries) => {
//       // **** LOG **** //
//       logger.log('GET', '/beneficiaries', currentuser, beneficiaries.length);
//       res.status(httpStatus.OK).send({ data: beneficiaries, errors: [] });
//     })
//     .catch((err) => {
//       // **** LOG **** //
//       logger.log('GET', '/beneficiaries', currentuser, err, false);
//       return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
//     })
// }

// GET beneficiaries
exports.getBeneficiaries = (req, res) => {
  const userType = tokenUtils.decodeToken( req.headers["authorization"]).userType;
  const userId = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const username = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || "createdAt";
  const search = req.query.search || "";
  const order = req.query.order || "asc";
  if (userType === "admin") {
    Beneficiary.find({ deleted: false })
      .then((beneficiaries) => {
        const filteredData = getBeneficiariesByeSearch(search, beneficiaries);
        const paginatedData = getResultsByParameters(
          page,
          limit,
          sort,
          order,
          filteredData
        );
        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / limit);
        // **** LOG **** //
        logger.log("GET", "/beneficiaries/", username);
        res.status(httpStatus.OK).json({
          totalItems,
          totalPages,
          data: paginatedData,
        });
      })
      .catch((err) => {
        // **** LOG **** //
        logger.log("GET", "/beneficiaries/", username, err, false);
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: "internalError", message: "Error: " + err });
      });
  } else if (userType === "editor") {
    Beneficiary.find({ deleted: false, createdBy: userId })
      .then((beneficiaries) => {
        const filteredData = getBeneficiariesByeSearch(search, beneficiaries);
        const paginatedData = getResultsByParameters(
          page,
          limit,
          sort,
          order,
          filteredData
        );
        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / limit);
        // **** LOG **** //
        logger.log("GET", "/beneficiaries/", username);
        res.status(httpStatus.OK).json({
          totalItems,
          totalPages,
          data: paginatedData,
        });
      })
      .catch((err) => {
        // **** LOG **** //
        logger.log("GET", "/beneficiaries/", username, err, false);
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: "internalError", message: "Error: " + err });
      });
  } else {
    // **** LOG **** //
    logger.log(
      "GET",
      "/beneficiaries/",
      username,
      "Usertype not allowed",
      false
    );
    res
      .status(httpStatus.FORBIDDEN)
      .json({
        error: "unauthorized",
        message: "User not authorized to do this.",
      });
  }
};

// // FUNCTION TO GET RESULTS BY SEARCH PARAMETER
function getBeneficiariesByeSearch(search, data) {
  let searchData;
  if (search) {
    searchData = data.filter((item) => {
      const fullname =
        item.name + " " + item.fatherSurname + " " + item.motherSurname;
      return (
        fullname.toLowerCase().includes(search.toLowerCase()) ||
        item.address.street.toLowerCase().includes(search.toLowerCase()) ||
        item.address.extNum?.toLowerCase().includes(search.toLowerCase()) ||
        item.address.intNum?.toLowerCase().includes(search.toLowerCase()) ||
        item.address.neighborhood
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.address.delegation.toLowerCase().includes(search.toLowerCase()) ||
        item.address.subdelegation
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.address.cp
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.sex.toString().toLowerCase().includes(search.toLowerCase()) ||
        item.age.toString().toLowerCase().includes(search.toLowerCase()) ||
        item.phone?.toString().toLowerCase().includes(search.toLowerCase()) ||
        item.curp.toLowerCase().includes(search.toLowerCase())
      );
    });
  }
  return search ? searchData : data;
}

// // FUNCTION TO GET RESULTS BY PARAMETERS
function getResultsByParameters(page, limit, sort, order, data) {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const sortedData = data.sort((a, b) => {
    if (a[sort] > b[sort]) return order === "asc" ? 1 : -1;
    if (a[sort] < b[sort]) return order === "asc" ? -1 : 1;
    return 0;
  });

  const paginatedData = sortedData.slice(startIndex, endIndex);
  return paginatedData || [];
}

// GET check if beneficiary is already registered by curp
exports.checkCurp = async (req, res) => {
  const { curp } = req.params;
  const currentuser = tokenUtils.decodeToken( req.headers["authorization"] ).username;

  try {
    const beneficiary = await Beneficiary.findOne({ curp });
    if (beneficiary) {
      return res.status(httpStatus.OK).send({ data: beneficiary, errors: [] });
    } else {
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0010] });
    }
  } catch (err) {
    logger.log("GET", `/beneficiary/check-curp`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
  }
};