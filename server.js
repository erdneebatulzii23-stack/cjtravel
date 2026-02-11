require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
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
} else {
    console.log("Warning: DATABASE_URL not set. Database features will fail.");
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
  if (!s3Client) {
      return res.status(503).json({ error: 'Storage not configured.' });
  }
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
    const fileUrl = `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${uniqueFileName}`;
    res.json({ uploadUrl: url, fileUrl: fileUrl });
  } catch (error) {
    console.error('Storage Error:', error);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

// --- DIGITAL OCEAN STATIC FILE SERVING ---
// This serves the compiled Angular app (Frontend)
app.use(express.static(path.join(__dirname, '../dist/client')));

// Catch-all route: For any request not starting with /api, send index.html
// This allows Angular Routing to work
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/client/index.html'));
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});