import { randomUUID } from "crypto";
import { Request } from "express";
import { StorageEngine } from "multer";
import path from "path";
import { FSInterface } from "../index";

type Destination =
  | string
  | ((req: Request, file: Express.Multer.File) => string);
export default class CustomStorageEngine implements StorageEngine {
  destination: Destination;
  fs: FSInterface;
  constructor(config: { destination: Destination; fs: FSInterface }) {
    this.destination = config.destination;
    this.fs = config.fs;
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (
      error?: unknown,
      info?: Partial<Express.Multer.File> | undefined
    ) => void
  ): void {
    if (typeof this.destination === "string") {
      file.destination = this.destination;
    } else
      try {
        file.destination = this.destination(req, file);
      } catch (err) {
        callback(err);
        return;
      }

    file.filename = randomUUID() + path.extname(file.originalname);
    file.path = path.join(file.destination, file.filename);
    this.fs
      .writeStream(file.path, file.stream)
      .then(() => callback(null, file))
      .catch((err) => callback(err));
  }

  _removeFile(
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void
  ): void {
    this.fs
      .rm(file.path)
      .then(() => callback(null))
      .catch((err) => callback(err as Error));
  }
}
