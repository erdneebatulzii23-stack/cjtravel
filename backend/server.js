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

// --- STATIC FILE SERVING (ЗАСВАР ОРСОН ХЭСЭГ) ---

const possiblePaths = [
    path.join(process.cwd(), 'dist/client'),
    path.join(process.cwd(), 'dist/analog/public'),
    path.join(process.cwd(), 'dist')
];

let clientDistPath = '';
for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.readdirSync(p).length > 0) {
        clientDistPath = p;
        console.log(`FOUND STATIC FILES AT: ${clientDistPath}`);
        break;
    }
}

if (clientDistPath) {
    app.use(express.static(clientDistPath));
}

// Catch-all route
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
    
    const indexPath = clientDistPath ? path.join(clientDistPath, 'index.html') : '';
    
    if (indexPath && fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <div style="font-family:sans-serif;padding:40px;text-align:center;">
                <h2>Frontend Build Not Found</h2>
                <p>Backend is working, but frontend files are missing.</p>
                <p>Checked: <code>dist/client, dist/analog/public, dist</code></p>
            </div>
        `);
    }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
