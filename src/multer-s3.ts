import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { DiskStorageOptions, StorageEngine } from "multer";
import { ParsedQs } from "qs";
import FS from "./lib";

type Destination =
  | string
  | ((req: Request, file: Express.Multer.File) => string);
class CustomStorageEngine implements StorageEngine {
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
    let fullpath: string;

    if (typeof this.destination === "string") fullpath = this.destination;
    else
      try {
        fullpath = this.destination(req, file);
      } catch (err) {
        callback(err);
        return;
      }

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
