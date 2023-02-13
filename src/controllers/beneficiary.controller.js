const Beneficiary = require('../models/beneficiary.model');
const Families = require('../models/family.model');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')

// CREATE benenficiary
exports.create = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers['authorization']).id;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  const { name, fatherSurname, motherSurname, age, birthdate, birthplace, sex, curp, phone, hasDisability,
    disabilityType, medicalService, civilStatus, scholarship, address, spouse, home, expenses, families } = req.body;

  const insetFamilies = families.map((family) => {
    return {
      ...family,
      createdBy,
      createdAt: new Date()
    }
  });  

  // Inserting Sample Famlies Documents
  const newFamilies = await Families.insertMany(insetFamilies);

  // Creating an array of Insurance IDs
  const familiesIds = newFamilies.map(
    (family) => family._id
  );

  console.log(familiesIds);

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
    address,
    spouse,
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
      logger.log('POST', '/beneficiaries/create', currentuser);
      res.status(httpStatus.OK).json({ data: { beneficiary: beneficiary }, errors: [], })
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('POST', '/beneficiaries/create', currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [err.code == 11000 ? errorCode.ERR0007 : errorCode.ERR0000] })
    })
};

// UPDATE beneficiary
exports.update = (req, res) => {
  const updatedBy = tokenUtils.decodeToken(req.headers['authorization']).id;
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  const { filter, update } = req.body;

  const beneficiary = {
    ...update,
    updatedBy,
    updatedAt: new Date()
  }
  Beneficiary.findOneAndUpdate(filter, beneficiary)
    .then((beneficiary) => {
      // **** LOG **** //
      logger.log('PUT', `/beneficiaries/update/${beneficiary._id}`, currentuser);
      res.status(httpStatus.OK).send({ data: beneficiary, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('PUT', `/beneficiaries/update/${beneficiary._id}`, currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
    })
}

// GET beneficiaries
exports.getBeneficiaries = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
  Beneficiary.find()
    .then((beneficiaries) => {
      // **** LOG **** //
      logger.log('GET', '/beneficiaries', currentuser, beneficiaries.length);
      res.status(httpStatus.OK).send({ data: beneficiaries, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log('GET', '/beneficiaries', currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] })
    })
}