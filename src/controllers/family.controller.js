const Family = require('../models/family.model');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')
const GetDate = require('../utils/GetDate')

// CREATE family
exports.create = (req, res) => {
    const createdBy = tokenUtils.decodeToken(req.headers['authorization']).id;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const { name, lastname, age, phone, relationship, occupation, income, scholarship, sex } = req.body;

    const family = new Family({
        name,
        lastname,
        age,
        sex,
        scholarship,
        phone,
        relationship,
        occupation,
        income,
        createdBy,
        createdAt: GetDate.date(),
    });
    family
        .save()
        .then(() => {
            // **** LOG **** //
            logger.log('POST', '/family/create', currentuser);
            res.status(httpStatus.OK).json({ data: family, errors: [], })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('POST', '/family/create', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};

exports.getFamiliesByBeneficiary = (req, res) => {
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const beneficiaryId = req.params.id;
    console.log(beneficiaryId)
    Family.find({ beneficiary: beneficiaryId })
        .then((families) => {
            // **** LOG **** //
            logger.log('GET', '/family/by-beneficiary', currentuser);
            res.status(httpStatus.OK).json({ data: families, errors: [] })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('GET', '/family/by-beneficiary', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};