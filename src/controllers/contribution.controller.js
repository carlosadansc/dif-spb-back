const Contribution = require("../models/contribution.model");
const Category = require("../models/category.model");
const ProductOrService = require("../models/product_or_service.model");
const Beneficiary = require("../models/beneficiary.model");
const mongoose = require("mongoose");
const tokenUtils = require("../utils/TokenUtils");
const logger = require("../utils/Logger");
const httpStatus = require("../common/HttpStatusCodes");
const errorCode = require("../common/ErroCodes");
const GetDate = require("../utils/GetDate");
const normalizeText = require("../utils/normalizedText");

exports.create = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  try {
    const {
      productOrServices,
      beneficiary,
      evidencePhoto,
      comments,
      contributionDate,
      receiver,
      donor,
    } = req.body;

    const contribution = new Contribution({
      productOrServices,
      beneficiary,
      evidencePhoto,
      comments,
      contributionDate,
      receiver,
      donor,
      createdBy,
      createdAt: GetDate.date(),
    });

    await contribution.save();

    // **** LOG **** //
    const foundBeneficiary = await Beneficiary.findById(beneficiary);
    foundBeneficiary.contributions.push(contribution._id);
    await Beneficiary.findByIdAndUpdate(beneficiary, {
      contributions: foundBeneficiary.contributions,
    });

    logger.log("POST", "/contribution/create", currentuser);
    res.status(httpStatus.OK).json({ data: contribution, errors: [] });
  } catch (err) {
    // **** LOG **** //
    logger.log("POST", "/contribution/create", currentuser, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err.message] });
  }
};

exports.getContribution = async (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  try {
    const contribution = await Contribution.findById(id)
      .populate("beneficiary", "curp name fatherSurname motherSurname") // Datos del beneficiario (individual)
      .populate("beneficiaries.beneficiary", "curp name fatherSurname motherSurname") // Datos de beneficiarios (masivos)
      .populate("createdBy", "name lastname position area") // Quién lo creó
      .populate({
        path: "productOrServices.productOrService", // Detalles del producto
        populate: {
          path: "category",
          select: "name label color" // Detalles de la categoría
        }
      })
      .lean(); // Convertir a objeto JS puro

    logger.log("GET", "/contribution/get-contribution", currentuser);
    res.status(httpStatus.OK).send({ data: contribution, errors: [] });
  } catch (error) {
    logger.log("GET", "/contribution/get-contribution", currentuser, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, error.message] });
  }
};

// GET contribution by Beneficiary
exports.getContributionsByBeneficiary = async (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;

  try {
    // Obtenemos las contribuciones con sus productOrServices
    // Usamos $or para buscar tanto en beneficiary (individuales) como en beneficiaries (masivos)
    const contributions = await Contribution.find({
      $or: [
        { beneficiary: id }, // Contribuciones individuales
        { "beneficiaries.beneficiary": id } // Contribuciones masivas
      ],
      deleted: false,
      active: true,
    })
      .populate("createdBy", "name lastname position")
      .lean().sort({ createdAt: -1 }); // Usar lean() para obtener objetos JavaScript planos

    // Para cada contribución, procesamos sus productos/servicios
    for (const contribution of contributions) {
      if (
        contribution.productOrServices &&
        contribution.productOrServices.length > 0
      ) {
        // Para cada producto o servicio, obtenemos su información completa incluyendo la categoría
        for (let i = 0; i < contribution.productOrServices.length; i++) {
          const productOrServiceId =
            contribution.productOrServices[i].productOrService;

          // Obtenemos el producto o servicio con su categoría
          const productOrService = await mongoose
            .model("ProductOrService")
            .findById(productOrServiceId)
            .populate("category", "_id name")
            .lean();

          if (productOrService) {
            // Reemplazamos la referencia con el objeto completo
            contribution.productOrServices[i].productOrService =
              productOrService;
          }
        }
      }
    }

    logger.log("GET", `/contribution/by-beneficiary/${id}`, currentuser);
    res.status(httpStatus.OK).send({ data: contributions, errors: [] });
  } catch (err) {
    logger.log("GET", `/contribution/by-beneficiary/${id}`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
  }
};

// GET contribution by Beneficiary for export
exports.getContributionsByBeneficiaryForExport = async (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;

  try {
    // Usamos $or para buscar tanto en beneficiary (individuales) como en beneficiaries (masivos)
    const contributions = await Contribution.find({
      $or: [
        { beneficiary: id }, // Contribuciones individuales
        { "beneficiaries.beneficiary": id } // Contribuciones masivas
      ],
      deleted: false,
      active: true,
    })
      .populate("createdBy", "name lastname position")
      .populate("beneficiary", "name")  // Agregado para obtener el nombre del beneficiario
      .lean();

    // Array para almacenar las filas resultantes
    const flatRows = [];

    // Para cada contribución, procesamos sus productos/servicios
    for (const contribution of contributions) {
      // Si no hay productos o servicios, añadimos una fila con la contribución básica
      if (!contribution.productOrServices || contribution.productOrServices.length === 0) {
        flatRows.push({
          contributionId: contribution._id,
          folio: contribution.folio,
          contributionDate: contribution.createdAt,
          beneficiaryId: id,
          beneficiaryName: contribution.beneficiary?.name || 'N/A',
          createdBy: `${contribution.createdBy?.name || ''} ${contribution.createdBy?.lastname || ''}`.trim() || 'N/A',
          description: contribution.description || 'N/A',
          productOrServiceId: null,
          productOrServiceName: null,
          categoryId: null,
          categoryName: null,
          quantity: null,
        });
      } else {
        // Para cada producto o servicio, obtenemos su información completa
        for (let i = 0; i < contribution.productOrServices.length; i++) {
          const item = contribution.productOrServices[i];
          const productOrServiceId = item.productOrService;

          // Obtenemos el producto o servicio con su categoría
          const productOrService = await mongoose.model("ProductOrService").findById(productOrServiceId)
            .populate("category", "_id name")
            .lean();

          // Creamos una fila para cada producto o servicio
          flatRows.push({
            contributionId: contribution._id,
            folio: contribution.folio,
            contributionDate: contribution.createdAt,
            beneficiaryId: id,
            beneficiaryName: contribution.beneficiary?.name || 'N/A',
            createdBy: `${contribution.createdBy?.name || ''} ${contribution.createdBy?.lastname || ''}`.trim() || 'N/A',
            description: item.description || 'N/A',
            productOrServiceId: productOrService?._id || null,
            productOrServiceName: productOrService?.name || 'N/A',
            categoryId: productOrService?.category?._id || null,
            categoryName: productOrService?.category?.name || 'N/A',
            quantity: item.quantity || 0,
          });
        }
      }
    }
    
    logger.log("GET", `/contribution/by-beneficiary/${id}/export`, currentuser);
    res.status(httpStatus.OK).send({ data: flatRows, errors: [] });
  } catch (err) {
    logger.log("GET", `/contribution/by-beneficiary/${id}/export`, currentuser, err, false);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000, err] });
  }
}; 

// GET all contributions with catergory
exports.getContributionsWithCategory = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  try {
    const contributions = await Contribution.aggregate([
      { $unwind: "$productOrServices" },
      {
        $lookup: {
          from: "productOrServices",
          localField: "productOrServices.productOrService",
          foreignField: "_id",
          as: "productOrServicesDestails",
        },
      },
      { $unwind: "$productOrServicesDestails" },
      {
        $group: {
          _id: "$productOrServicesDestails.category",
          totalQuantity: { $sum: "$productOrServices.quantity" },
          contributions: { $push: "$$ROOT" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // **** LOG **** //
    logger.log("GET", `/contribution/categories`, currentuser);
    res.status(httpStatus.OK).send({ data: contributions, errors: [] });
  } catch (err) {
    // **** LOG **** //
    logger.log("GET", `/contribution/categories`, currentuser, err, false);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ data: {}, errors: [errorCode.ERR0000, err] });
  }
};

// GET all years
exports.getContributionYears = (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  Contribution.aggregate([
    { $group: { _id: { $year: "$contributionDate" } } },
    { $sort: { _id: -1 } },
  ])
    .exec()
    .then((years) => {
      // **** LOG **** //
      logger.log("GET", "/contribution/years", currentuser);
      res.status(httpStatus.OK).json({ data: years, errors: [] });
    })
    .catch((err) => {
      // **** LOG **** //
      logger.log("GET", "/contribution/years", currentuser, err, false);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send({ data: {}, errors: [errorCode.ERR0000] });
    });
};

// GET summary of contributions by year and month
exports.getContributionSummary = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;

  try {
    const { month, year } = req.query;

    // 1. Construir filtro de fecha
    const dateFilter = {};
    // Construir filtro de fecha basado en año y mes
    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1);
      const endDate = new Date(year, month ? month : 12, 1);
      dateFilter.contributionDate = { $gte: startDate, $lt: endDate };
    } else if (month) {
      throw new Error("No se puede filtrar por mes sin especificar el año");
    }

    // 2. Obtener contribuciones como objetos planos (lean)
    const contributions = await Contribution.find({
      ...dateFilter,
      active: true,
      deleted: false,
    }).lean();

    // 3. Procesar cada contribución para obtener detalles completos
    for (const contribution of contributions) {
      if (
        contribution.productOrServices &&
        contribution.productOrServices.length > 0
      ) {
        for (let i = 0; i < contribution.productOrServices.length; i++) {
          const productOrServiceId =
            contribution.productOrServices[i].productOrService;

          // Obtener producto/servicio con su categoría poblada
          const productOrService = await mongoose
            .model("ProductOrService")
            .findById(productOrServiceId)
            .populate("category", "name color") // Asegurar que obtenemos name y color
            .lean();

          if (productOrService) {
            // Reemplazar la referencia con el objeto completo
            contribution.productOrServices[i].productOrService =
              productOrService;
          }
        }
      }
    }

    // 4. Agrupar por categoría
    const categoryMap = new Map();

    contributions.forEach((contribution) => {
      contribution.productOrServices.forEach((item) => {
        const product = item.productOrService;
        if (!product?.category) return;

        const category = product.category;
        const categoryId = category._id.toString();
        const quantity = item.quantity;

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            categoryId,
            name: category.name,
            color: category.color,
            total: 0,
          });
        }

        categoryMap.get(categoryId).total += quantity;
      });
    });

    // 5. Convertir a array y ordenar
    const result = Array.from(categoryMap.values()).sort(
      (a, b) => b.total - a.total
    );

    logger.log(
      "GET",
      `/contribution/summary?month=${month}&year=${year}`,
      currentuser
    );
    res.status(httpStatus.OK).json({ data: result, errors: [] });
  } catch (error) {
    logger.log(
      "GET",
      `/contribution/summary?month=${month}&year=${year}`,
      currentuser,
      error,
      false
    );
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ data: {}, errors: [errorCode.ERR0000, error] });
  }
};

//Get summary of contribution Items by category, year and month
exports.getContributionSummaryByCategory = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  try {
    const { month, year, categoryId } = req.query;

    // 1. Validar categoryId (si existe)
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      // **** LOG **** //
      logger.log(
        "GET",
        "/contribution/summary-by-category",
        currentuser,
        "Invalid category ID",
        false
      );
      return res.status(httpStatus.BAD_REQUEST).json({
        data: {},
        errors: [errorCode.ERR0000, "ID de categoría inválido"],
      });
    }

    // 2. Construir filtros
    const filters = { active: true, deleted: false };
    if (year) {
      const startDate = new Date(year, month ? month - 1 : 0, 1);
      const endDate = new Date(year, month ? month : 12, 1);
      filters.contributionDate = { $gte: startDate, $lt: endDate };
    } else if (month) {
      throw new Error("No se puede filtrar por mes sin especificar el año");
    }

    // 3. Pipeline de agregación (versión corregida)
    const result = await Contribution.aggregate([
      { $match: filters },
      { $unwind: "$productOrServices" },

      // Lookup SIEMPRE necesario para obtener el nombre
      {
        $lookup: {
          from: "productorservices", // Nombre de la colección (case-sensitive)
          localField: "productOrServices.productOrService",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },

      // Filtro opcional por categoría
      ...(categoryId
        ? [
            {
              $match: {
                "productData.category": mongoose.Types.ObjectId(categoryId),
              },
            },
          ]
        : []),

      // Agrupación final
      {
        $group: {
          _id: "$productOrServices.productOrService",
          name: { $first: "$productData.name" }, // Ahora siempre tendrá valor
          total: { $sum: "$productOrServices.quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          name: 1,
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    // **** LOG **** //
    logger.log(
      "GET",
      `/contribution/summary-by-category?categoryId=${categoryId}&month=${month}&year=${year}`,
      currentuser,
      "",
      true
    );
    res.status(httpStatus.OK).json({ data: result, errors: [] });
  } catch (error) {
    // **** LOG **** //
    logger.log(
      "GET",
      `/contribution/summary-by-category?categoryId=${categoryId}&month=${month}&year=${year}`,
      currentuser,
      error,
      false
    );
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ data: {}, errors: [errorCode.ERR0000, error] });
  }
};

exports.getAllContributions = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  try {
    const contributions = await Contribution.find()
      .populate(
        "beneficiary",
        "curp name fatherSurname motherSurname birthdate sex age address.street address.extNum address.neighborhood address.delegation address.subdelegation address.zipCode"
      )
      .populate({
        path: "productOrServices.productOrService",
        populate: {
          path: "category",
          select: "label", // Seleccionamos el campo name de la categoría
        },
      })
      .populate("createdBy", "name lastname")
      .lean(); // Usar lean() para obtener objetos JavaScript planos en lugar de documentos Mongoose

    // Formato de fecha reutilizable
    const dateFormat = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };

    // 1. Normalizar los datos para Excel de manera más eficiente
    const rows = contributions.flatMap((contribution) => {
      // Extraer datos del beneficiario para reutilizarlos
      const beneficiary = contribution.beneficiary || {};
      const address = beneficiary.address || {};

      // Datos comunes para todas las filas de esta contribución
      const commonData = {
        folio: contribution.folio || "",
        curp: beneficiary.curp || "",
        nombre: beneficiary.name || "",
        "apellido paterno": beneficiary.fatherSurname || "",
        "apellido materno": beneficiary.motherSurname || "",
        "fecha de nacimiento": beneficiary.birthdate
          ? new Date(beneficiary.birthdate).toLocaleString("es-MX", dateFormat)
          : "Fecha desconocida",
        sexo: beneficiary.sex || "",
        edad: beneficiary.age || "",
        calle: address.street || "",
        numero: address.extNum || "",
        colonia: address.neighborhood || "",
        delegacion: address.delegation || "",
        subdilegacion: address.subdelegation || "",
        "codigo postal": address.zipCode || "",
        "fecha de apoyo": contribution.createdAt
          ? new Date(contribution.createdAt).toLocaleString("es-MX", dateFormat)
          : "Fecha desconocida",
        "quien recibio": contribution.receiver || "No especificado",
        "quien entrego": contribution.createdBy
          ? `${contribution.createdBy.name || ""} ${
              contribution.createdBy.lastname || ""
            }`.trim()
          : "Usuario desconocido",
      };

      // Si no hay productos, crear una fila con datos vacíos
      if (!contribution.productOrServices?.length) {
        return [
          {
            ...commonData,
            "tipo de apoyo": "Sin categoria",
            "apoyo otorgado": "Sin productos",
            cantidad: 0,
          },
        ];
      }

      // Crear una fila por cada producto manteniendo los datos comunes
      return contribution.productOrServices.map((product) => ({
        ...commonData,
        "tipo de apoyo":
          product.productOrService?.category?.label || "Sin categoría",
        "apoyo otorgado": product.description || "",
        cantidad: product.quantity || 0,
      }));
    });

    logger.log("GET", "/contributions/get-all", currentuser);
    return res.status(httpStatus.OK).send({ data: rows, errors: [] });
  } catch (error) {
    logger.log("GET", "/contributions/get-all", currentuser, error, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      data: {},
      errors: [errorCode.ERR0000, error.message || "Error desconocido"],
    });
  }
};

exports.createContributionsWithMultipleBeneficiaries = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;

  try {
    const {
      productOrServices,
      beneficiaries, // Array de { curp, name, fatherSurname, motherSurname }
      evidencePhoto,
      comments,
      contributionDate,
      receiver,
      donor,
    } = req.body;

    // Validaciones básicas
    if (!beneficiaries || !Array.isArray(beneficiaries) || beneficiaries.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        data: {},
        errors: [errorCode.ERR0000, "Debe proporcionar al menos un beneficiario"],
      });
    }

    // Comentario especial para jornadas masivas
    const massiveEventComment = `${comments || ""}\n\n[JORNADA MASIVA] ESTE APOYO FUE ENTREGADO COMO PARTE DE UNA JORNADA DE APOYO MASIVO CON ${beneficiaries.length} BENEFICIARIOS.`.trim();

    // Arrays para almacenar resultados
    const processedBeneficiaries = [];
    const beneficiariesForContribution = [];
    const errors = [];

    // Procesar cada beneficiario
    for (const beneficiaryData of beneficiaries) {
      try {
        const { curp, name, fatherSurname, motherSurname } = beneficiaryData;

        // Validar datos mínimos
        if (!curp || !name || !fatherSurname) {
          errors.push({
            curp: curp || "SIN_CURP",
            error: "Faltan datos obligatorios (CURP, nombre o apellido paterno)",
          });
          continue;
        }

        // Normalizar datos del beneficiario
        const normalizedCurp = normalizeText(curp.trim());
        const normalizedName = normalizeText(name.trim());
        const normalizedFatherSurname = normalizeText(fatherSurname.trim());
        const normalizedMotherSurname = motherSurname ? normalizeText(motherSurname.trim()) : "";

        // Buscar beneficiario existente por CURP
        let beneficiary = await Beneficiary.findOne({ curp: normalizedCurp });

        if (beneficiary) {
          // Beneficiario existente
          processedBeneficiaries.push(beneficiary);
          beneficiariesForContribution.push({ beneficiary: beneficiary._id });
        } else {
          // Crear nuevo beneficiario con datos genéricos
          beneficiary = new Beneficiary({
            curp: normalizedCurp,
            name: normalizedName,
            fatherSurname: normalizedFatherSurname,
            motherSurname: normalizedMotherSurname,
            // Datos genéricos mínimos requeridos
            age: 0, // Edad desconocida
            sex: "NO ESPECIFICADO",
            phone: "0000000000", // Teléfono genérico
            comments: "BENEFICIARIO CREADO EN JORNADA MASIVA. DATOS INCOMPLETOS.",
            createdBy: createdBy,
          });

          await beneficiary.save();
          processedBeneficiaries.push(beneficiary);
          beneficiariesForContribution.push({ beneficiary: beneficiary._id });
        }

      } catch (beneficiaryError) {
        errors.push({
          curp: beneficiaryData.curp || "DESCONOCIDO",
          error: beneficiaryError.message,
        });
      }
    }

    // Crear UNA SOLA contribución masiva con todos los beneficiarios
    const massiveContribution = new Contribution({
      productOrServices, // Cantidad total (ej: 150)
      beneficiaries: beneficiariesForContribution, // Array de todos los beneficiarios
      evidencePhoto,
      comments: massiveEventComment,
      contributionDate,
      receiver,
      donor,
      createdBy,
      createdAt: GetDate.date(),
      haveMultipleBeneficiaries: true,
    });

    await massiveContribution.save();

    // Actualizar el array de contribuciones de cada beneficiario
    for (const beneficiary of processedBeneficiaries) {
      beneficiary.contributions.push(massiveContribution._id);
      await Beneficiary.findByIdAndUpdate(beneficiary._id, {
        contributions: beneficiary.contributions,
      });
    }

    // Preparar respuesta
    const response = {
      totalBeneficiaries: beneficiaries.length,
      processedSuccessfully: processedBeneficiaries.length,
      failedBeneficiaries: errors.length,
      errors: errors.length > 0 ? errors : [],
      contribution: massiveContribution,
    };

    logger.log("POST", "/contribution/create-multiple", currentuser);
    res.status(httpStatus.OK).json({ 
      data: response, 
      errors: errors.length > 0 ? ["Algunos beneficiarios no pudieron procesarse"] : [] 
    });

  } catch (err) {
    logger.log("POST", "/contribution/create-multiple", currentuser, err, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      data: {}, 
      errors: [errorCode.ERR0000, err.message] 
    });
  }
};

exports.getMassiveContributions = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = "createdAt", 
      order = "desc", 
      search = "", 
      startDate, 
      endDate, 
      category 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtro inicial
    let matchStage = {
      haveMultipleBeneficiaries: true,
      active: true,
      deleted: false,
    };

    // Filtro de búsqueda (search)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      matchStage.$or = [
        { folio: searchRegex },
        { comments: searchRegex },
        { receiver: searchRegex }
      ];
    }

    // Filtro de rango de fechas
    if (startDate || endDate) {
      matchStage.contributionDate = {};
      if (startDate) {
        matchStage.contributionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        matchStage.contributionDate.$lte = endD;
      }
    }

    // Pipeline de agregación para poder filtrar por categoría
    if (!category) {
      const contributions = await Contribution.find(matchStage)
        .sort({ [sort]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "name lastname position area")
        .populate({
          path: "productOrServices.productOrService",
          populate: { path: "category", model: "Category" }
        })
        .populate({
            path: 'beneficiaries.beneficiary',
            select: 'name curp' 
        })
        .lean();

      const total = await Contribution.countDocuments(matchStage);

      logger.log("GET", "/contribution/massive-contributions", currentuser);
      return res.status(httpStatus.OK).send({ 
        data: contributions, 
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        },
        errors: [] 
      });
    }

    // Si HAY filtro de categoría
    const productsInCategory = await mongoose.model("ProductOrService").find({ category }).select("_id");
    const productIds = productsInCategory.map(p => p._id);

    matchStage["productOrServices.productOrService"] = { $in: productIds };

    const contributions = await Contribution.find(matchStage)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "name lastname position area")
      .populate({
        path: "productOrServices.productOrService",
        populate: { path: "category", model: "Category" }
      })
      .populate({
          path: 'beneficiaries.beneficiary',
          select: 'name curp'
      })
      .lean();

    const total = await Contribution.countDocuments(matchStage);

    logger.log("GET", "/contribution/massive-contributions-filtered", currentuser);
    res.status(httpStatus.OK).send({ 
      data: contributions, 
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      errors: [] 
    });

  } catch (error) {
    logger.log("GET", "/contribution/massive-contributions", currentuser, error, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      data: {},
      errors: [errorCode.ERR0000, error.message || "Error desconocido"],
    });
  }
};
