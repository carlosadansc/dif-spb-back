const Area = require("../models/area.model");
const tokenUtils = require("../utils/TokenUtils");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");
const GetDate = require("../utils/GetDate");

exports.create = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  try {
    const { name, parentArea } = req.body;

    const area = new Area({
      name,
      parentArea,
      createdBy,
      createdAt: GetDate.date(),
    });

    await area.save();

    logger.log("POST", "/area/create", currentuser);
    res.status(httpStatus.OK).json({ data: area, errors: [] });
  } catch (err) {
    logger.log("POST", "/area/create", currentuser, err, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err.message] });
  }
};

exports.getAll = async (req, res) => {
    const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
    try {
        const areas = await Area.find({active: true}).populate("parentArea", "name");
        if (!areas) {
            return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
        }
        logger.log("GET", "/areas", currentuser);
        res.status(httpStatus.OK).json({ data: areas, errors: [] });
    } catch (err) {
        logger.log("GET", "/areas", currentuser, err, false);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
    }
}

exports.update = async (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { update } = req.body;
  const updatedBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const updatedArea = {
      ...update,
      updatedBy,
      updatedAt: GetDate.date(),
  }

  Area.findByIdAndUpdate(id, updatedArea, { new: true })
    .then((area) => {
      logger.log("PUT", `/area/update/${id}`, currentuser);
      res.status(httpStatus.OK).json({ data: area, errors: [] });
    })
    .catch((err) => {
      logger.log("PUT", `/area/update/${id}`, currentuser, err, false);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
    });
}

exports.delete = async (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  try {
    const area = await Area.findByIdAndDelete(id);
    if (!area) {
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }
    logger.log("DELETE", `/area/delete/${id}`, currentuser);
    res.status(httpStatus.OK).json({ data: area, errors: [] });
  } catch (err) {
    logger.log("DELETE", `/area/delete/${id}`, currentuser, err, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
  }
}