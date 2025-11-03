require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');
const UserRoutes = require('./src/routes/user.routes');
const BeneficiaryRoutes = require('./src/routes/beneficiary.routes');
const familyRoutes = require('./src/routes/family.routes');
// const FamilyRoutes = require('./routes/family.routes');
const ContributionItemRoutes = require('./src/routes/product_or_service.routes');
const ContributionRoutes = require('./src/routes/contribution.routes');
// const EventRoutes = require('./routes/event.routes');
const ContributionItemCategoryRoutes = require('./src/routes/category.routes');
const ImageRoutes = require('./src/routes/images.routes');
const AreaRoutes = require('./src/routes/area.routes');
const SocioeconomicAssessmentRoutes = require('./src/routes/socioeconomic_assessment.routes');


const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors())
app.use('/uploads', express.static('uploads'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
mongoose.set('strictQuery', false);

// ROUTES
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome DIF Sistema Integral Padron de Apoyos API 2024' })
})
app.use(UserRoutes);
app.use(BeneficiaryRoutes);
app.use(ContributionItemRoutes);
app.use(ContributionRoutes);
app.use(ContributionItemCategoryRoutes);
app.use(familyRoutes);
app.use(ImageRoutes);
app.use(AreaRoutes);
app.use(SocioeconomicAssessmentRoutes);
// app.use(EventRoutes);

// MONGODB CONNECTION
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB:' + process.env.NODE_ENV))
  .catch(err => console.log('Error connecting to MongoDB: ' + err))


// LISTENER MONGODB CONNECTION
setInterval(function () {
  if(mongoose.connection.readyState !== 1)console.log('Checking MongoDB connection...' + mongoose.connection.readyState);
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB:' + process.env.NODE_ENV))
    .catch(err => console.log('Error connecting to MongoDB: ' + err))
  }
}, 10000); 

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});