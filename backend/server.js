import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import pkg from 'pg'; // <-- ЗАССАН: pg-ийг ингэж дуудах ёстой
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Config
dotenv.config();
const { Pool } = pkg; // <-- ЗАССАН
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Database (Optional warning)
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
} else {
    console.warn("⚠️ DATABASE_URL missing. DB features won't work.");
}

// S3 Storage (Optional warning)
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
} else {
    console.warn("⚠️ S3 Config missing. File upload won't work.");
}

// API Routes
app.get('/api/health', (req, res) => res.send('CJ Travel Backend Running!'));

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
    res.json({ uploadUrl: url, fileUrl: `${publicBase}/${uniqueFileName}` });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

// --- STATIC FILE SERVING (CRITICAL FIX) ---
// Root folder-оос ажиллаж байгаа тул process.cwd() ашиглана
const clientDistPath = path.join(process.cwd(), 'dist/client');

console.log(`📂 Serving Frontend from: ${clientDistPath}`);

if (fs.existsSync(clientDistPath)) {
    // 1. Static файлуудыг эхлээд уншуулна
    app.use(express.static(clientDistPath));

    // 2. Бусад бүх хүсэлтийг index.html рүү явуулна (SPA Support)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    console.error(`❌ Build folder NOT found at: ${clientDistPath}`);
    app.get('*', (req, res) => {
        res.status(500).send(`Server Error: Frontend build not found at ${clientDistPath}. Check build logs.`);
    });
}

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
