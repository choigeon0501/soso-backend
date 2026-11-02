import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/** 리뷰 이미지는 장당 최대 5MB, jpg·jpeg·png만 받는다. */
export const REVIEW_IMAGE_UPLOAD_OPTIONS: MulterOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) cb(null, true);
    else cb(new Error('Only images allowed!'), false);
  },
};
