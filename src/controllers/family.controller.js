const Family = require('../models/family.model');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')

// CREATE family
exports.create = (req, res) => {
    const createdBy = tokenUtils.decodeToken(req.headers['authorization']).id;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const { name, lastname, age, phone, relationship } = req.body;

    const family = new Family({
        name,
        lastname,
        age,
        phone,
        relationship,
        createdBy,
        createdAt: new Date(),
    });
    family
        .save()
        .then(() => {
            // **** LOG **** //
            logger.log('POST', '/familiar/create', currentuser);
            res.status(httpStatus.OK).json({ data: family, errors: [], })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('POST', '/familiar/create', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};