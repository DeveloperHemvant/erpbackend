import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import * as multer from 'multer';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype !== 'text/csv' &&
          !file.originalname.endsWith('.csv')
        ) {
          return cb(
            new BadRequestException('Only CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string, // 'staff', 'students', 'classes'
    @Body('campusId') campusId: string,
    @Body('sessionId') sessionId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!type || !campusId || !sessionId) {
      throw new BadRequestException(
        'Missing required fields: type, campusId, sessionId',
      );
    }

    return this.importService.processCsv(
      file.buffer,
      type,
      campusId,
      sessionId,
    );
  }
}
