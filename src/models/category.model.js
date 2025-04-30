const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    label: { 
        type: String, 
        required: true,
        trim: true 
    },
    description: { 
        type: String, 
        required: false 
    },
    color: { 
        type: String, 
        required: true,
        validate: {
            validator: (v) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v),
            message: 'Color debe ser un código HEX (ej. #FF5733)'
        }
    },
    productOrServices: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ProductOrService',
        autopopulate: true
    }],
    active: { 
        type: Boolean, 
        default: true 
    },
    deleted: { 
        type: Boolean, 
        default: false 
    },
    createdBy: { 
        type: String, 
        required: true 
    },
    updatedBy: { 
        type: String 
    }
}, { 
    timestamps: true,  // Reemplaza createdAt/updatedAt manuales
    versionKey: false  // Opcional: Elimina __v
});

// Índices para mejorar consultas
CategorySchema.index({ name: 1 });
CategorySchema.index({ active: 1 });
CategorySchema.index({ deleted: 1 });

// Plugin para autopopulate (si lo usas)
CategorySchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Category', CategorySchema);