const Beneficiary = require('../Models/beneficiary.model');
const TokenUtils = require('../Utilities/TokenUtils');
const Logger = require('../Utilities/Logger');

// CREATE benenficiary
exports.create = (req, res) => {
    const userId = TokenUtils.decodeToken(req.headers['authorization']).id;
    const username = TokenUtils.decodeToken(req.headers['authorization']).email;

    const beneficiary = new Beneficiary({
      name: req.body.name.trim(),
      fatherSurname: req.body.fatherSurname.trim(),
      motherSurname: req.body.motherSurname.trim(),
      birthdate: req.body.birthdate,
      street: req.body.street.trim(),
      extnum: req.body.extnum.trim(),
      intnum: req.body.intnum.trim(),
      neighborhood: req.body.neighborhood.trim(),
      city: req.body.city.trim(),
      township: req.body.township.trim(),
      cp: req.body.cp,
      federalDistrict: req.body.federalDistrict,
      electoralSection: req.body.electoralSection.toString().toUpperCase().trim(),
      email: req.body.email.trim(),
      phoneNumber: req.body.phoneNumber,
      cellPhoneNumber: req.body.cellPhoneNumber,
      electoralKeyCurp: req.body.electoralKeyCurp.trim(),
      typeRegister: req.body.typeRegister.trim(),
      signed: req.body.signed,
      deleted: req.body.deleted,
      createdBy: userId,
      updatedBy: userId,
    });
    beneficiary
      .save()
      .then(() => {
        // **** LOG **** //
        Logger.log('POST', '/beneficiaries/create', username);
        res.status(200).json("Beneficiary created!")
      })
      .catch((err) => {
        // **** LOG **** //
        Logger.log('POST', '/beneficiaries/create', username, err, false);
        res.status(500).json({ error: 'internalError', message: "Error: " + err })
      })
  };
  