require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
const port = process.env.PORT || 8080;

// 1. Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 2. Database Connection
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
}

// 3. Storage Connection
let s3Client = null;
if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
}

// --- API ROUTES ---
app.get('/api/health', (req, res) => {
  res.send('CJ Travel Backend is running!');
});

app.post('/api/upload-url', async (req, res) => {
  if (!s3Client) return res.status(503).json({ error: 'Storage not configured.' });
  try {
    const { fileName, fileType } = req.body;
    const uniqueFileName = `uploads/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
      ACL: 'public-read'
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    let publicBase = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
    if (!publicBase.startsWith('http')) publicBase = `https://${publicBase}`;
    const fileUrl = `${publicBase}/${uniqueFileName}`;
    res.json({ uploadUrl: url, fileUrl: fileUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

// --- FRONTEND SERVING (ЗАСВАР ОРСОН ХЭСЭГ) ---

// Angular 17+ нь 'dist/cjtravel/browser' дотор үүсдэг, хуучин нь 'dist/cjtravel' дотор үүсдэг.
// Хоёуланг нь шалгана.
const distPathBrowser = path.join(process.cwd(), 'dist/cjtravel/browser');
const distPathRoot = path.join(process.cwd(), 'dist/cjtravel');

let clientDistPath = null;

if (fs.existsSync(distPathBrowser)) {
    clientDistPath = distPathBrowser;
} else if (fs.existsSync(distPathRoot)) {
    clientDistPath = distPathRoot;
}

if (clientDistPath) {
    console.log(`Serving frontend from: ${clientDistPath}`); // Log руу зам хэвлэнэ
    app.use(express.static(clientDistPath));
    
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    console.error('Frontend build folder not found! Searched in:', distPathBrowser, 'and', distPathRoot);
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.status(500).send(`
                <h1>Deployment Error</h1>
                <p>Frontend build folder not found.</p>
                <p>Server looked for: <code>dist/cjtravel/browser</code> or <code>dist/cjtravel</code></p>
                <p>Check your angular.json "outputPath" setting.</p>
            `);
        } else {
             res.status(404).json({ error: 'API route not found' });
        }
    });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
