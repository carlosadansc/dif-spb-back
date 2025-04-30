const mongoose = require('mongoose')

const ProductOrServiceSchema = new mongoose.Schema({
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category',
        required: [true, 'La categoría es obligatoria'],
    },
    name: { 
        type: String, 
        required: [true, 'El nombre es obligatorio'],
        unique: true,
        trim: true 
    },
    description: { 
        type: String, 
        required: [true, 'La descripción es obligatoria'] 
    },
    approxPrice: { 
        type: Number, 
        min: 0,
        required: false 
    },
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
    timestamps: true,  // Auto-genera createdAt y updatedAt
    versionKey: false  // Desactiva __v (opcional)
});

// Añadir índices
ProductOrServiceSchema.index({ name: 1 });
ProductOrServiceSchema.index({ category: 1 });

// Plugin para autopopulate (si lo usas)
ProductOrServiceSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('ProductOrService', ProductOrServiceSchema);