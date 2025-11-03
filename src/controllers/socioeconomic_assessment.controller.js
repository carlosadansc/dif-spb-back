const SocioeconomicAssessment = require("../models/socioeconomic_assessment.model");
const Beneficiary = require("../models/beneficiary.model");
const Family = require("../models/family.model");
const tokenUtils = require("../utils/TokenUtils");
const GetDate = require("../utils/GetDate");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");

// CREATE socioeconomic assessment - captures current state of beneficiary
exports.create = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { beneficiaryId } = req.params;
  const { notes, assessmentDate } = req.body;

  try {
    // Find beneficiary
    const beneficiary = await Beneficiary.findById(beneficiaryId).populate("families");

    if (!beneficiary) {
      logger.log("POST", `/socioeconomic-assessment/create/${beneficiaryId}`, currentuser, "Beneficiary not found", false);
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }

    // Prepare family members snapshot
    const familyMembers = beneficiary.families.map(family => ({
      name: family.name,
      lastname: family.lastname,
      age: family.age,
      sex: family.sex,
      scholarship: family.scholarship,
      phone: family.phone,
      relationship: family.relationship,
      occupation: family.occupation,
      income: family.income || 0,
    }));

    // Calculate totals
    const familyIncome = familyMembers.reduce((sum, member) => sum + (member.income || 0), 0);
    const spouseIncome = beneficiary.spouseOrTutor?.income || 0;
    const totalHouseholdIncome = (beneficiary.income || 0) + spouseIncome + familyIncome;

    const totalHouseholdExpenses = Object.values(beneficiary.expenses || {}).reduce(
      (sum, expense) => sum + (expense || 0),
      0
    );

    const householdSize = 1 + (beneficiary.spouseOrTutor?.fullname ? 1 : 0) + familyMembers.length;

    // Create snapshot
    const snapshot = {
      income: beneficiary.income,
      occupation: beneficiary.occupation,
      occupationDescription: beneficiary.occupationDescription,
      scholarship: beneficiary.scholarship,
      civilStatus: beneficiary.civilStatus,
      medicalService: beneficiary.medicalService,
      address: beneficiary.address,
      spouseOrTutor: beneficiary.spouseOrTutor,
      home: beneficiary.home,
      expenses: beneficiary.expenses,
      familyMembers,
      totalHouseholdIncome,
      totalHouseholdExpenses,
      householdSize,
    };

    // Create assessment
    const assessment = new SocioeconomicAssessment({
      beneficiary: beneficiaryId,
      assessmentDate: assessmentDate || new Date(),
      snapshot,
      notes,
      createdBy,
    });

    const savedAssessment = await assessment.save();

    // Add reference to beneficiary
    await Beneficiary.findByIdAndUpdate(
      beneficiaryId,
      { $push: { socioeconomicAssessments: savedAssessment._id } },
      { new: true }
    );

    logger.log("POST", `/socioeconomic-assessment/create/${beneficiaryId}`, currentuser);
    res.status(httpStatus.OK).json({ data: savedAssessment, errors: [] });
  } catch (err) {
    logger.log("POST", `/socioeconomic-assessment/create/${beneficiaryId}`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, err.message],
    });
  }
};

// GET all assessments for a beneficiary
exports.getByBeneficiary = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { beneficiaryId } = req.params;

  try {
    const assessments = await SocioeconomicAssessment.find({
      beneficiary: beneficiaryId,
      deleted: false,
    }).sort({ assessmentDate: -1 });

    logger.log("GET", `/socioeconomic-assessment/beneficiary/${beneficiaryId}`, currentuser);
    res.status(httpStatus.OK).json({ data: assessments, errors: [] });
  } catch (err) {
    logger.log("GET", `/socioeconomic-assessment/beneficiary/${beneficiaryId}`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, err.message],
    });
  }
};

// GET single assessment by ID
exports.getById = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { id } = req.params;

  try {
    const assessment = await SocioeconomicAssessment.findById(id);

    if (!assessment) {
      logger.log("GET", `/socioeconomic-assessment/${id}`, currentuser, "Assessment not found", false);
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }

    logger.log("GET", `/socioeconomic-assessment/${id}`, currentuser);
    res.status(httpStatus.OK).json({ data: assessment, errors: [] });
  } catch (err) {
    logger.log("GET", `/socioeconomic-assessment/${id}`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, err.message],
    });
  }
};

// GET latest assessment for a beneficiary
exports.getLatest = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { beneficiaryId } = req.params;

  try {
    const assessment = await SocioeconomicAssessment.findOne({
      beneficiary: beneficiaryId,
      deleted: false,
    }).sort({ assessmentDate: -1 });

    if (!assessment) {
      logger.log("GET", `/socioeconomic-assessment/latest/${beneficiaryId}`, currentuser, "No assessments found", false);
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }

    logger.log("GET", `/socioeconomic-assessment/latest/${beneficiaryId}`, currentuser);
    res.status(httpStatus.OK).json({ data: assessment, errors: [] });
  } catch (err) {
    logger.log("GET", `/socioeconomic-assessment/latest/${beneficiaryId}`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, err.message],
    });
  }
};

// UPDATE assessment (notes and metadata only, not snapshot)
exports.update = async (req, res) => {
  const userId = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { id } = req.params;
  const { notes, assessmentType } = req.body;

  try {
    const updateData = {
      updatedBy: userId,
      updatedAt: GetDate.date(),
    };

    if (notes !== undefined) updateData.notes = notes;
    if (assessmentType !== undefined) updateData.assessmentType = assessmentType;

    const assessment = await SocioeconomicAssessment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!assessment) {
      logger.log("PUT", `/socioeconomic-assessment/update/${id}`, currentuser, "Assessment not found", false);
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }

    logger.log("PUT", `/socioeconomic-assessment/update/${id}`, currentuser);
    res.status(httpStatus.OK).send({ data: assessment, errors: [] });
  } catch (error) {
    logger.log("PUT", `/socioeconomic-assessment/update/${id}`, currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, error.message],
    });
  }
};

// SOFT DELETE assessment
exports.delete = async (req, res) => {
  const userId = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { id } = req.params;

  try {
    const assessment = await SocioeconomicAssessment.findByIdAndUpdate(
      id,
      {
        deleted: true,
        updatedBy: userId,
        updatedAt: GetDate.date(),
      },
      { new: true }
    );

    if (!assessment) {
      logger.log("DELETE", `/socioeconomic-assessment/delete/${id}`, currentuser, "Assessment not found", false);
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }

    // Remove reference from beneficiary
    await Beneficiary.findByIdAndUpdate(
      assessment.beneficiary,
      { $pull: { socioeconomicAssessments: id } },
      { new: true }
    );

    logger.log("DELETE", `/socioeconomic-assessment/delete/${id}`, currentuser);
    res.status(httpStatus.OK).send({ data: assessment, errors: [] });
  } catch (error) {
    logger.log("DELETE", `/socioeconomic-assessment/delete/${id}`, currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, error.message],
    });
  }
};

// COMPARE two assessments
exports.compare = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { id1, id2 } = req.params;

  try {
    const [assessment1, assessment2] = await Promise.all([
      SocioeconomicAssessment.findById(id1),
      SocioeconomicAssessment.findById(id2),
    ]);

    if (!assessment1 || !assessment2) {
      logger.log("GET", `/socioeconomic-assessment/compare/${id1}/${id2}`, currentuser, "One or both assessments not found", false);
      return res.status(httpStatus.NOT_FOUND).json({ data: {}, errors: [errorCode.ERR0001] });
    }

    // Calculate differences
    const comparison = {
      assessment1: {
        id: assessment1._id,
        date: assessment1.assessmentDate,
        snapshot: assessment1.snapshot,
      },
      assessment2: {
        id: assessment2._id,
        date: assessment2.assessmentDate,
        snapshot: assessment2.snapshot,
      },
      differences: {
        income: (assessment2.snapshot.income || 0) - (assessment1.snapshot.income || 0),
        totalHouseholdIncome:
          (assessment2.snapshot.totalHouseholdIncome || 0) - (assessment1.snapshot.totalHouseholdIncome || 0),
        totalHouseholdExpenses:
          (assessment2.snapshot.totalHouseholdExpenses || 0) - (assessment1.snapshot.totalHouseholdExpenses || 0),
        householdSize: (assessment2.snapshot.householdSize || 0) - (assessment1.snapshot.householdSize || 0),
      },
    };

    logger.log("GET", `/socioeconomic-assessment/compare/${id1}/${id2}`, currentuser);
    res.status(httpStatus.OK).json({ data: comparison, errors: [] });
  } catch (err) {
    logger.log("GET", `/socioeconomic-assessment/compare/${id1}/${id2}`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, err.message],
    });
  }
};
