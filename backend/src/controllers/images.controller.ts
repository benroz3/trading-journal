import { Request, Response, NextFunction } from 'express';
import * as imagesService from '../services/images.service';

export async function upload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No image files provided' });
      return;
    }

    const images = await imagesService.upload(req.params.tradeId, files);
    res.status(201).json(images);
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await imagesService.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function serve(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const url = await imagesService.getSignedReadUrl(req.params.id);
    if (!url) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    res.setHeader('Cache-Control', 'private, max-age=300');
    res.redirect(302, url);
  } catch (err) {
    next(err);
  }
}
