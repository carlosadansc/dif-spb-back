const Event = require('../models/event.model');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')
const GetDate = require('../utils/GetDate')

// CREATE event
exports.create = (req, res) => {
    const createdBy = tokenUtils.decodeToken(req.headers['authorization']).id;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const { type, subject, canalization, comments } = req.body;

    const event = new Event({
        type,
        subject,
        canalization,
        comments,
        createdBy,
        createdAt: GetDate.date(),
    });
    event
        .save()
        .then(() => {
            // **** LOG **** //
            logger.log('POST', '/event/create', currentuser);
            res.status(httpStatus.OK).json({ data: event, errors: [], })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('POST', '/event/create', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};