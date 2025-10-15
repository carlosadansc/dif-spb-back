const Beneficiary = require("../models/beneficiary.model");
const User = require("../models/user.model");
const Contribution = require("../models/contribution.model");
const Families = require("../models/family.model");
const tokenUtils = require("../utils/TokenUtils");
const GetDate = require("../utils/GetDate");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");
const path = require('path');
const fs = require('fs').promises;

// CREATE beneficiary
exports.create = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const {
    name,
    fatherSurname,
    motherSurname,
    age,
    birthdate,
    birthplace,
    sex,
    isIndigenousCommunity,
    indigenousCommunity,
    isLgbtq,
    sexualOrientation,
    curp,
    phone,
    hasDisability,
    disabilityType,
    medicalService,
    civilStatus,
    scholarship,
    income,
    occupation,
    occupationDescription,
    comments,
    address,
    spouseOrTutor,
    home,
    expenses,
  } = req.body;

  const beneficiary = new Beneficiary({
    name,
    fatherSurname,
    motherSurname,
    age,
    birthdate,
    birthplace,
    sex,
    isIndigenousCommunity,
    indigenousCommunity,
    isLgbtq,
    sexualOrientation,
    curp,
    phone,
    hasDisability,
    disabilityType,
    medicalService,
    civilStatus,
    scholarship,
    income,
    occupation,
    occupationDescription,
    comments,
    address,
    spouseOrTutor,
    home,
    expenses,
    createdBy,
    createdAt: GetDate.date(),
  });

  const exist = await Beneficiary.findOne({ curp });

  if (exist) {
    logger.log("POST", "/beneficiaries/create", currentuser, errorCode.ERR0007.title, false);
    return res.status(httpStatus.BAD_REQUEST).json({ data: {}, errors: [errorCode.ERR0007] });
  }

  await beneficiary
    .save()
    .then(() => {
      logger.log("POST", "/beneficiaries/create", currentuser);
      res.status(httpStatus.OK).json({ data: { beneficiary }, errors: [] });
    })
    .catch((err) => {
      logger.log("POST", "/beneficiaries/create", currentuser, err, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        data: {},
        errors: [err.code == 11000 ? errorCode.ERR0007 : errorCode.ERR0000],
      });
    });
};

// UPDATE beneficiary
exports.update = (req, res) => {
  const userId = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { filter, update } = req.body;
  console.log(userId)
  const updatedBeneficiary = {
    ...update,
    updatedBy: userId,
    updatedAt: GetDate.date(),
  };

  Beneficiary.findByIdAndUpdate(filter, updatedBeneficiary, { new: true })
    .then((result) => {
      // **** LOG **** //
      logger.log("PUT", `/beneficiary/update/${result._id}`, currentuser);
      res.status(httpStatus.OK).send({ data: result, errors: [] });
    })
    .catch((error) => {
      // **** LOG **** //
      logger.log("PUT", `/beneficiary/update/${filter}`, currentuser, error, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error.message] });
    });
};

// GET simple data user by id
exports.getBeneficiaryById = (req, res) => {
  const { id } = req.params;
  const currentUser = tokenUtils.decodeToken(req.headers["authorization"]).username;

  Beneficiary.findById(id)
    .then((beneficiary) => {
      if (beneficiary) {
        logger.log("GET", `/beneficiary/${id}`, currentUser);
        return res.status(httpStatus.OK).send({ data: beneficiary, errors: [] });
      }
      logger.log("GET", `/beneficiary/${id}`, currentUser, errorCode.ERR0001.title, false);
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001] });
    })
    .catch((error) => {
      logger.log("GET", `/beneficiary/${id}`, currentUser, error, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error] });
    });
};

// GET beneficiaries count
exports.getBeneficiariesCount = async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;

    let query = { deleted: false };

    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const count = await Beneficiary.countDocuments(query);

    logger.log("GET", "/beneficiaries/count", currentuser);
    return res.status(httpStatus.OK).send({
      data: { count },
      errors: [],
    });
  } catch (err) {
    logger.log("GET", "/beneficiaries/count", currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, err],
    });
  }
};

// GET beneficiaries with advanced search, filtering, and pagination
exports.getBeneficiaries = async (req, res) => {
  try {
    const { userType, id: userId, username } = tokenUtils.decodeToken(req.headers["authorization"]);
    const { 
      page = 1, 
      limit = 10, 
      sort = "createdAt", 
      order = "asc", 
      search = "",
      // Additional filter parameters
      sex,
      hasDisability,
      medicalService,
      civilStatus,
      scholarship,
      minAge,
      maxAge,
      communityType,
      delegation,
      subdelegation,
      neighborhood,
      isIndigenousCommunity,
      isLgbtq,
      includeDeleted = true
    } = req.query;

    // Build base query
    const query = {};
    
    // Handle soft delete filter
    if (!includeDeleted) {
      query.deleted = false;
    }

    // Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { fatherSurname: searchRegex },
        { motherSurname: searchRegex },
        { curp: searchRegex },
        { phone: searchRegex },
        { 'address.street': searchRegex },
        { 'address.neighborhood': searchRegex },
        { 'spouseOrTutor.fullname': searchRegex },
        { 'spouseOrTutor.curp': searchRegex }
      ];
    }

    // Apply additional filters if provided
    if (sex) query.sex = sex;
    if (hasDisability !== undefined) query.hasDisability = hasDisability === 'true';
    if (medicalService) query.medicalService = medicalService;
    if (civilStatus) query.civilStatus = civilStatus;
    if (scholarship) query.scholarship = scholarship;
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge);
      if (maxAge) query.age.$lte = parseInt(maxAge);
    }
    if (communityType) query['address.communityType'] = communityType;
    if (delegation) query['address.delegation'] = delegation;
    if (subdelegation) query['address.subdelegation'] = subdelegation;
    if (neighborhood) query['address.neighborhood'] = neighborhood;
    if (isIndigenousCommunity !== undefined) query.isIndigenousCommunity = isIndigenousCommunity === 'true';
    if (isLgbtq !== undefined) query.isLgbtq = isLgbtq === 'true';

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortOrder;

    // Execute queries in parallel
    const [totalItems, beneficiaries] = await Promise.all([
      Beneficiary.countDocuments(query),
      Beneficiary.find(query)
        .populate('createdBy', 'name username')
        .populate('updatedBy', 'name username')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    
    logger.log("GET", `/beneficiaries?${new URLSearchParams(req.query).toString()}`, username);
    return res.status(httpStatus.OK).send({
      data: { 
        totalItems, 
        beneficiaries, 
        totalPages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        filters: {
          search,
          sex,
          hasDisability,
          medicalService,
          civilStatus,
          scholarship,
          minAge,
          maxAge,
          communityType,
          delegation,
          subdelegation,
          neighborhood,
          isIndigenousCommunity,
          isLgbtq,
          includeDeleted
        }
      },
      errors: []
    });
  } catch (err) {
    console.error('Error in getBeneficiaries:', err);
    logger.log("GET", `/beneficiaries?${new URLSearchParams(req.query).toString()}`, 'system', err.message, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      data: {},
      errors: [errorCode.ERR0000, err.message]
    });
  }
};


// GET check if beneficiary is already registered by CURP
exports.checkCurp = async (req, res) => {
  const { curp } = req.params;
  const username = tokenUtils.decodeToken(req.headers["authorization"]).username;

  try {
    const existingBeneficiary = await Beneficiary.findOne({ curp });
    if (existingBeneficiary) {
      logger.log("GET", `/beneficiary/check-curp/${curp}`, username);
      return res.status(httpStatus.OK).send({data: existingBeneficiary, errors: []});
    }
    logger.log("GET", `/beneficiary/check-curp/${curp}`, username, errorCode.ERR0001.title);
    return res.status(httpStatus.OK).send({data: existingBeneficiary, errors: []});
  } catch (error) {
    logger.log("GET", `/beneficiary/check-curp/${curp}`, username, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({data: {}, errors: [errorCode.ERR0000, error]});
  }
};

exports.createFamily = async (req, res) => {
  const { id: beneficiaryId } = req.params;
  const { name, lastname, age, sex, scholarship, phone, relationship, occupation, income } = req.body;
  const createdBy = tokenUtils.decodeToken(req.headers.authorization).id;
  const currentuser = tokenUtils.decodeToken(req.headers.authorization).username;
  
  try {
    const beneficiary = await Beneficiary.findById(beneficiaryId);

    if (!beneficiary) {
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001] });
    }

    const family = new Families({
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

    const savedFamily = await family.save();
    const updateResult = await Beneficiary.findByIdAndUpdate(
      beneficiaryId, 
      { $push: { families: savedFamily._id } }, 
      { new: true }
    );
    
    logger.log("POST", `/beneficiary/${beneficiaryId}/family-create`, currentuser);
    return res.status(httpStatus.OK).send({ data: savedFamily, errors: [] });
  } catch (error) {
    logger.log("POST", `/beneficiary/${beneficiaryId}/family-create`, currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error] });
  }
};

exports.deleteFamily = async (req, res) => {
  const { beneficiaryId, familyId } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers.authorization).username;

  try {
    const family = await Families.findByIdAndDelete(familyId);

    if (!family) {
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001] });
    }

    await Beneficiary.findByIdAndUpdate(
      beneficiaryId, 
      { $pull: { families: familyId } }, 
      { new: true }
    );

    logger.log("DELETE", `/beneficiary/${beneficiaryId}/family-delete/${familyId}`, currentuser);
    return res.status(httpStatus.OK).send({ data: family, errors: [] });
  } catch (error) {
    logger.log("DELETE", `/beneficiary/${beneficiaryId}/family-delete/${familyId}`, currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error] });
  }
}

exports.getBeneficiaryFamily = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers.authorization).username;
  const { id } = req.params;
  try {
    const beneficiary = await Beneficiary.findById(id).populate('families').lean();

    if (!beneficiary) {
      logger.log("GET", `/beneficiary/${id}/family`, currentuser, errorCode.ERR0001.title, false);
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001] });
    }

    const families = beneficiary.families;

    if (!families) {
      logger.log("GET", `/beneficiary/${id}/family`, currentuser, errorCode.ERR0001.title, false);
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001] });
    }

    logger.log("GET", `/beneficiary/${id}/family`, currentuser);
    res.status(httpStatus.OK).send({ data: families, errors: [] });
  } catch (error) {
    logger.log("GET", `/beneficiary/${id}/family`, currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error] });
  }
};
 
// GET nombres de los familiares y conyuge/tutor de un beneficiario
exports.getBeneficiaryFamilyNames = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers.authorization).username;
  const { id } = req.params;

  try {
    const beneficiary = await Beneficiary.findById(id).populate('families').populate('spouseOrTutor');

    if (!beneficiary) {
      logger.log("GET", `/beneficiary/${id}/family-names`, currentuser, errorCode.ERR0001.title, false);
      return res.status(httpStatus.NOT_FOUND).send({ data: {}, errors: [errorCode.ERR0001] });
    }

    const families = [
      ...beneficiary.families.map((family, index) => ({
        _id: index + 1,
        name: `${family.name} ${family.lastname}`,
      })),
      ...(beneficiary.spouseOrTutor
        ? [
            {
              _id: beneficiary.families.length + 1,
              name: `${beneficiary.spouseOrTutor.fullname}`,
            },
          ]
        : []),
    ];

    logger.log("GET", `/beneficiary/${id}/family-names`, currentuser);
    return res.status(httpStatus.OK).send({ data: families, errors: [] });
  } catch (error) {
    logger.log("GET", `/beneficiary/${id}/family-names`, currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error] });
  }
};



// POST generar CURP provisional
exports.generateCurp = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers.authorization).username;
  try {
    const curp = await generateUniqueCurp();
    logger.log("GET", "/generate-curp", currentuser, curp);
    return res.status(httpStatus.OK).send({ data: curp, errors: [] });
  } catch (error) {
    logger.log("GET", "/generate-curp", currentuser, error, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error] });
  }
};

// Función para generar un CURP provisional único
async function generateUniqueCurp() {
  const curp = generateCurp();
  const exists = await Beneficiary.exists({ curp });
  if (exists) {
    return generateUniqueCurp();
  }
  return curp;
}

// Función para generar un CURP aleatorio
function generateCurp() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  // Generar primeras 4 letras (PROV)
  const firstLetter = "P";
  const secondLetter = "R";
  const thirdLetter = "O";
  const fourthLetter = "V";

  // Generar 6 números aleatorios
  const numbersPart = Array(6).fill(0).map(() => numbers[Math.floor(Math.random() * numbers.length)]).join('');

  // Generar letra de género (H o M)
  const genderLetter = Math.random() < 0.5 ? 'H' : 'M';

  // Generar 5 letras aleatorias
  const lettersPart = Array(5).fill(0).map(() => letters[Math.floor(Math.random() * letters.length)]).join('');

  // Generar 2 dígitos aleatorios
  const digitsPart = Array(2).fill(0).map(() => numbers[Math.floor(Math.random() * numbers.length)]).join('');

  // Armar el CURP
  const curp = `${firstLetter}${secondLetter}${thirdLetter}${fourthLetter}${numbersPart}${genderLetter}${lettersPart}${digitsPart}`;

  // Validar el CURP con la expresión regular
  if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/.test(curp)) {
    return generateCurp(); // Si no es válido, generar otro CURP
  }

  return curp;
}

// GET delegaciones y número total de beneficiarios
exports.getDelegationsAndBeneficiaries = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers.authorization).username;
  try {
    // 1. Obtener el conteo de beneficiarios por delegación
    const delegationCounts = await Beneficiary.aggregate([
      { 
        $match: { 
          active: true, 
          deleted: false,
          "address.delegation": { $exists: true, $ne: null, $ne: "" } // Solo delegaciones con valor
        } 
      },
      { 
        $group: {
          _id: "$address.delegation",
          count: { $sum: 1 }
        }
      },
      { 
        $project: {
          delegation: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { delegation: 1 } } // Ordenar alfabéticamente aquí
    ]);

    // 2. Obtener todas las delegaciones únicas directamente desde los beneficiarios
    const allDelegations = await Beneficiary.distinct("address.delegation", {
      "address.delegation": { $exists: true, $ne: null, $ne: "" }
    });

    if (!allDelegations || allDelegations.length === 0) {
      logger.log("GET", "/beneficiaries/by-delegations", currentuser, "No se encontraron delegaciones registradas", false);
      return res.status(404).json({ data: {}, errors: [errorCode.ERR0001, 'No se encontraron delegaciones registradas'] });
    }

    // 3. Combinar datos para incluir delegaciones con 0 beneficiarios
    const formattedDelegations = allDelegations.map(delegation => {
      const countData = delegationCounts.find(d => d.delegation === delegation);
      return {
        delegation: delegation,
        count: countData ? countData.count : 0
      };
    }).sort((a, b) => a.delegation.localeCompare(b.delegation)); // Ordenar por nombre

    // 4. Calcular total general
    const totalBeneficiaries = formattedDelegations.reduce((sum, item) => sum + item.count, 0);

    // 5. Devolver respuesta estructurada
    logger.log("GET", "/beneficiaries/by-delegations", currentuser);
    res.status(200).json({ data: { delegations: formattedDelegations, totalDelegations: formattedDelegations.length, totalBeneficiaries: totalBeneficiaries }, errors: [] });

  } catch (error) {
    logger.log("GET", "/beneficiaries/by-delegations", currentuser, error, false);
    res.status(500).json({ data: {}, errors: [errorCode.ERR0000, error] });
  }
};

// GET beneficiarios por sexo
exports.getBeneficiariesBySex = async (req, res) => {
  try {
    // 1. Realizar la agregación para contar por sexo
    const sexCounts = await Beneficiary.aggregate([
      { 
        $match: { 
          active: true,
          deleted: false,
          sex: { $exists: true, $ne: null } // Solo beneficiarios con sexo definido
        }
      },
      {
        $group: {
          _id: "$sex",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          sex: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { sex: 1 } } // Ordenar alfabéticamente
    ]);

    // 2. Definir los posibles valores de sexo (según tu modelo: HOMBRE, MUJER)
    const possibleSexValues = ['HOMBRE', 'MUJER'];

    // 3. Asegurarnos de que todos los valores posibles estén en la respuesta
    const completeSexCounts = possibleSexValues.map(sex => {
      const found = sexCounts.find(item => item.sex === sex);
      return {
        sex: sex,
        count: found ? found.count : 0
      };
    });

    // 4. Calcular el total general
    const totalBeneficiaries = completeSexCounts.reduce((sum, item) => sum + item.count, 0);

    // 5. Enviar respuesta
    res.status(200).json({
      success: true,
      data: {
        stats: completeSexCounts,
        totalBeneficiaries: totalBeneficiaries
      },
      timestamp: GetDate.date()
    });

  } catch (error) {
    console.error('Error en getBeneficiariesBySex:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas por sexo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// GET beneficiarios por comunidad indígena
exports.getBeneficiariesByIndigenousCommunity = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Construir el objeto de filtro base
    const matchStage = { 
      active: true,
      deleted: false,
      indigenousCommunity: { $exists: true, $ne: null } // Solo beneficiarios con comunidad indígena definida
    };

    // Agregar filtros de año y mes si están presentes
    if (year) {
      const startDate = month 
        ? new Date(parseInt(year), parseInt(month) - 1, 1) // Primer día del mes
        : new Date(parseInt(year), 0, 1); // Primer día del año
      
      const endDate = month
        ? new Date(parseInt(year), parseInt(month), 1) // Primer día del mes siguiente
        : new Date(parseInt(year) + 1, 0, 1); // Primer día del año siguiente
      
      matchStage.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // 1. Realizar la agregación para contar por comunidad indígena
    const indigenousCommunityCounts = await Beneficiary.aggregate([
      { 
        $match: matchStage
      },
      {
        $group: {
          _id: "$indigenousCommunity",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          indigenousCommunity: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { indigenousCommunity: 1 } } // Ordenar alfabéticamente
    ]);

    // 2. Definir los posibles valores de comunidad indígena (según tu modelo)
    const possibleIndigenousCommunityValues = ['NACIONAL', 'MEXICANO', 'INDIGENA'];

    // 3. Asegurarnos de que todos los valores posibles estén en la respuesta
    const completeIndigenousCommunityCounts = possibleIndigenousCommunityValues.map(indigenousCommunity => {
      const found = indigenousCommunityCounts.find(item => item.indigenousCommunity === indigenousCommunity);
      return {
        indigenousCommunity: indigenousCommunity,
        count: found ? found.count : 0
      };
    });

    // 4. Calcular el total general
    const totalBeneficiaries = completeIndigenousCommunityCounts.reduce((sum, item) => sum + item.count, 0);

    // 5. Enviar respuesta
    res.status(200).json({
      success: true,
      data: {
        stats: completeIndigenousCommunityCounts,
        totalBeneficiaries: totalBeneficiaries,
        filters: {
          year: year || 'all',
          month: month || 'all'
        }
      },
      timestamp: GetDate.date()
    });

  } catch (error) {
    console.error('Error en getBeneficiariesByIndigenousCommunity:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas por comunidad indígena',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Delete beneficiary with all related data
exports.deleteBeneficiaryWithAllRelatedData = async (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"])?.username;

  try {
    const deletedBeneficiary = await Beneficiary.findByIdAndRemove(id);
    
    if (!deletedBeneficiary) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el beneficiario con id=${id}.`
      });
    }

    
    await deleteImage(deletedBeneficiary.photo);
    await Contribution.deleteMany({ beneficiary: id });

    deletedBeneficiary.families.forEach(async familyId => {
      await Families.findByIdAndRemove(familyId);
    });
    
    logger.log("DELETE", `/beneficiary/${id}`, currentuser);
    
    res.status(200).json({
      success: true,
      message: "El beneficiario y sus datos relacionados se eliminaron correctamente"
    });
    
  } catch (error) {
    console.error('Error al eliminar beneficiario:', error);
    logger.log("DELETE", `/beneficiary/${id}`, currentuser, error, false);
    
    res.status(500).json({
      success: false,
      message: "Error al eliminar el beneficiario",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteImage = async (filePath) => {

    if (!filePath) return;
  // Construct the full path to the uploads directory
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const fileName = path.basename(filePath); // Get just the filename
    const fullPath = path.join(uploadsDir, fileName);

    try {
     // Check if file exists
    await fs.access(fullPath, fs.constants.F_OK);
    
    // Delete the file
    await fs.unlink(fullPath);
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
    }
}