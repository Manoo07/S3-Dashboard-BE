// app.js

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors
const authRoutes = require('./routes/authRoutes');
const multer = require('multer');
const { uploadFile, downloadFile, getAllFilesWithId, getTotalDownloads } = require('./controllers/fileController');
const upload = multer(); 

dotenv.config();
const app = express();

// Enable CORS
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Public route
// app.get('/', (req, res) => {
//     res.send('<a href="/auth/google">Login With Google</a>');
// });

// // Use authRoutes for all auth-related endpoints
// app.use(authRoutes);

app.post('/upload', upload.single('file'), uploadFile);
app.get('/download/:fileId', downloadFile);
app.get('/files', getAllFilesWithId);
app.get('/downloads', getTotalDownloads);

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});
