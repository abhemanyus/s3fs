import { randomUUID } from "crypto";
import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { StorageEngine } from "multer";
import path from "path";
import { ParsedQs } from "qs";
import FS from "./lib";

type Destination =
  | string
  | ((req: Request, file: Express.Multer.File) => string);
export default class CustomStorageEngine implements StorageEngine {
  destination: Destination;
  constructor(config: { destination: Destination }) {
    this.destination = config.destination;
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (
      error?: any,
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
    FS.writeStream(file.path, file.stream)
      .then(() => callback(null, file))
      .catch((err) => callback(err));
  }

  _removeFile(
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    file: Express.Multer.File,
    callback: (error: Error | null) => void
  ): void {
    FS.rm(file.path)
      .then(() => callback(null))
      .catch((err) => callback(err));
  }
}
