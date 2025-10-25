const mongoose = require('mongoose')
const app = require('./app')
require('dotenv').config()

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONOGODB_URI missing in environment');
    process.exit(1)
} 
mongoose.connect(MONGODB_URI
//     , {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// }
).then(()=> {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`)
    });
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1)
})