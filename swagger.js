const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'API de Mascotas',
        description: 'Documentación de la API para el Sistema del Padron de Beneficiarios del SMDIF La Paz B.C.S',
    },
    host: 'localhost:3000',
    schemes: ['http'],
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./server.js']; // Cambia este archivo según el punto de entrada de tu API

swaggerAutogen(outputFile, endpointsFiles).then(() => {
    require('./server.js'); // Inicia el servidor automáticamente
});