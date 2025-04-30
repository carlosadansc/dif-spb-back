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

exports.create = async (req, res) => {
  const createdBy = tokenUtils.decodeToken(req.headers["authorization"]).id;
  const currentuser = tokenUtils.decodeToken(
    req.headers["authorization"]
  ).username;
  try {
    const {
      productOrServices,
      beneficiary,
      comments,
      contributionDate,
      receiver,
    } = req.body;

    const contribution = new Contribution({
      productOrServices,
      beneficiary,
      comments,
      contributionDate,
      receiver,
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
    logger.log("POST", "/contribution/create", currentuser, err, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ data: {}, errors: [errorCode.ERR0000] });
  }
};

// GET contribution by Beneficiary
exports.getContributionsByBeneficiary = async (req, res) => {
  const { id } = req.params;
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;

  try {
    // Obtenemos las contribuciones con sus productOrServices
    const contributions = await Contribution.find({ 
      beneficiary: id, 
      deleted: false, 
      active: true 
    }).lean(); // Usar lean() para obtener objetos JavaScript planos
    
    // Para cada contribución, procesamos sus productos/servicios
    for (const contribution of contributions) {
      if (contribution.productOrServices && contribution.productOrServices.length > 0) {
        // Para cada producto o servicio, obtenemos su información completa incluyendo la categoría
        for (let i = 0; i < contribution.productOrServices.length; i++) {
          const productOrServiceId = contribution.productOrServices[i].productOrService;
          
          // Obtenemos el producto o servicio con su categoría
          const productOrService = await mongoose.model('ProductOrService').findById(productOrServiceId)
            .populate('category', '_id name')
            .lean();
            
          if (productOrService) {
            // Reemplazamos la referencia con el objeto completo
            contribution.productOrServices[i].productOrService = productOrService;
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
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  
  try {
    const { month, year } = req.query;

    // 1. Construir filtro de fecha
    const dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      dateFilter.contributionDate = { $gte: startDate, $lt: endDate };
    }

    // 2. Obtener contribuciones como objetos planos (lean)
    const contributions = await Contribution.find({
      ...dateFilter,
      active: true,
      deleted: false
    }).lean();

    // 3. Procesar cada contribución para obtener detalles completos
    for (const contribution of contributions) {
      if (contribution.productOrServices && contribution.productOrServices.length > 0) {
        for (let i = 0; i < contribution.productOrServices.length; i++) {
          const productOrServiceId = contribution.productOrServices[i].productOrService;
          
          // Obtener producto/servicio con su categoría poblada
          const productOrService = await mongoose.model('ProductOrService').findById(productOrServiceId)
            .populate('category', 'name color') // Asegurar que obtenemos name y color
            .lean();
            
          if (productOrService) {
            // Reemplazar la referencia con el objeto completo
            contribution.productOrServices[i].productOrService = productOrService;
          }
        }
      }
    }

    // 4. Agrupar por categoría
    const categoryMap = new Map();

    contributions.forEach(contribution => {
      contribution.productOrServices.forEach(item => {
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
            total: 0
          });
        }

        categoryMap.get(categoryId).total += quantity;
      });
    });

    // 5. Convertir a array y ordenar
    const result = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);

    logger.log("GET", `/contribution/summary?month=${month}&year=${year}`, currentuser);
    res.status(httpStatus.OK).json({ data: result, errors: [] });

  } catch (error) {
    logger.log("GET", `/contribution/summary?month=${month}&year=${year}`, currentuser, error, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: {}, errors: [errorCode.ERR0000, error] });
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
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({
          data: {},
          errors: [errorCode.ERR0000, "ID de categoría inválido"],
        });
    }

    // 2. Construir filtros
    const filters = { active: true, deleted: false };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      filters.contributionDate = { $gte: startDate, $lt: endDate };
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
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  try {
    const contributions = await Contribution.find()
      .populate("beneficiary", "curp name fatherSurname motherSurname birthdate sex age address.street address.extNum address.neighborhood address.delegation address.subdelegation address.zipCode")
      .populate({
        path: "productOrServices.productOrService",
        populate: {
          path: "category",
          select: "label" // Seleccionamos el campo name de la categoría
        }
      })
      .populate("createdBy", "name lastname")
      .lean(); // Usar lean() para obtener objetos JavaScript planos en lugar de documentos Mongoose

    // Formato de fecha reutilizable
    const dateFormat = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    // 1. Normalizar los datos para Excel de manera más eficiente
    const rows = contributions.flatMap(contribution => {
      // Extraer datos del beneficiario para reutilizarlos
      const beneficiary = contribution.beneficiary || {};
      const address = beneficiary.address || {};
      
      // Datos comunes para todas las filas de esta contribución
      const commonData = {
        'folio': contribution.folio || '',
        'curp': beneficiary.curp || '',
        'nombre': beneficiary.name || '',
        'apellido paterno': beneficiary.fatherSurname || '',
        'apellido materno': beneficiary.motherSurname || '',
        'fecha de nacimiento': beneficiary.birthdate 
          ? new Date(beneficiary.birthdate).toLocaleString('es-MX', dateFormat) 
          : 'Fecha desconocida',
        'sexo': beneficiary.sex || '',
        'edad': beneficiary.age || '',
        'calle': address.street || '',
        'numero': address.extNum || '',
        'colonia': address.neighborhood || '',
        'delegacion': address.delegation || '',
        'subdilegacion': address.subdelegation || '',
        'codigo postal': address.zipCode || '',
        'fecha de apoyo': contribution.createdAt 
          ? new Date(contribution.createdAt).toLocaleString('es-MX', dateFormat) 
          : 'Fecha desconocida',
        'quien recibio': contribution.receiver || 'No especificado',
        'quien entrego': contribution.createdBy 
          ? `${contribution.createdBy.name || ''} ${contribution.createdBy.lastname || ''}`.trim() 
          : 'Usuario desconocido'
      };
      
      // Si no hay productos, crear una fila con datos vacíos
      if (!contribution.productOrServices?.length) {
        return [{
          ...commonData,
          'tipo de apoyo': 'Sin categoria',
          'apoyo otorgado': 'Sin productos',
          'cantidad': 0
        }];
      }
      
      // Crear una fila por cada producto manteniendo los datos comunes
      return contribution.productOrServices.map(product => ({
        ...commonData,
        'tipo de apoyo': product.productOrService?.category?.label || 'Sin categoría',
        'apoyo otorgado': product.description || '',
        'cantidad': product.quantity || 0
      }));
    });

    logger.log("GET", "/contributions/get-all", currentuser);
    return res.status(httpStatus.OK).send({ data: rows, errors: [] });

  } catch (error) {
    logger.log("GET", "/contributions/get-all", currentuser, error, false);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
      data: {}, 
      errors: [errorCode.ERR0000, error.message || 'Error desconocido'] 
    });
  }
};