const Contribution = require('../models/contribution.model');
const Beneficiary = require('../models/beneficiary.model');
const tokenUtils = require('../utils/TokenUtils');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes')
const errorCode = require('../common/ErroCodes')

// CREATE contribution
exports.create = async (req, res) => {
    const createdBy = tokenUtils.decodeToken(req.headers['authorization']).id;
    const currentuser = tokenUtils.decodeToken(req.headers['authorization']).username;
    const { contributionItem, beneficiary, applicant, quantity } = req.body;

    const contribution = new Contribution({
        contributionItem,
        beneficiary,
        applicant,
        quantity,
        createdBy,
        createdAt: new Date(),
    });
    await contribution
        .save()
        .then(async () => {
            // **** LOG **** //
            const foundBeneficiary = await Beneficiary.findById(beneficiary);
            foundBeneficiary.contributions.push(contribution._id);
            await Beneficiary.findOneAndUpdate({_id: beneficiary}, { contributions: foundBeneficiary.contributions});
            logger.log('POST', '/contribution/create', currentuser);
            res.status(httpStatus.OK).json({ data: contribution, errors: [], })
        })
        .catch((err) => {
            // **** LOG **** //
            logger.log('POST', '/contribution/create', currentuser, err, false);
            return res.status(httpStatus.UNAUTHORIZED).send({ data: {}, errors: [errorCode.ERR0000] });
        })
};