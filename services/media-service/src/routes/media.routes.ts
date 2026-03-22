import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { AppError } from '../utils/AppError';

const router: Router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

const provider = env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET ? 'cloudinary' : 'local';

if (provider === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const folderSchema = z.object({ folder: z.string().optional() });

router.post('/upload', authenticate, authorizeRoles('admin', 'vendor'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('File is required', 400, 'VALIDATION_ERROR');

    const parsed = folderSchema.safeParse(req.body);
    const folder = parsed.success && parsed.data.folder ? parsed.data.folder.replace(/[^a-zA-Z0-9_/-]/g, '') : 'general';

    if (provider === 'cloudinary') {
      const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploaded = await cloudinary.uploader.upload(dataUri, {
        folder: `bookmytrip/${folder}`,
        resource_type: 'auto',
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded',
        data: {
          provider,
          publicId: uploaded.public_id,
          url: uploaded.secure_url,
          bytes: uploaded.bytes,
          mimeType: req.file.mimetype,
          uploadedBy: req.user?.id,
        },
      });
      return;
    }

    const diskFolder = path.join(process.cwd(), env.MEDIA_STORAGE_DIR, folder);
    await fs.promises.mkdir(diskFolder, { recursive: true });
    const ext = path.extname(req.file.originalname) || '.bin';
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    const target = path.join(diskFolder, fileName);
    await fs.promises.writeFile(target, req.file.buffer);

    res.status(201).json({
      success: true,
      message: 'File uploaded',
      data: {
        provider,
        publicId: `${folder}/${fileName}`,
        url: `/uploads/${folder}/${fileName}`,
        bytes: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user?.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:publicId', authenticate, authorizeRoles('admin', 'vendor'), async (req, res, next) => {
  try {
    const publicId = decodeURIComponent(req.params.publicId);
    if (provider === 'cloudinary') {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      res.status(200).json({ success: true, message: 'Asset deleted', data: { publicId } });
      return;
    }

    const sanitized = publicId.replace(/\.\./g, '');
    const fullPath = path.join(process.cwd(), env.MEDIA_STORAGE_DIR, sanitized);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }

    res.status(200).json({ success: true, message: 'Asset deleted', data: { publicId: sanitized } });
  } catch (error) {
    next(error);
  }
});

export default router;
