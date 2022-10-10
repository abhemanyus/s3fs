import CustomStorageEngine from "./src/multer";
import S3_FS, { Init as InitS3 } from "./src/lib-aws";
import NODE_FS, { Init as InitNode } from "./src/lib-node";
import { Readable, Writable } from "stream";
export interface FSInterface {
  uploadStream(dest: string): {
    writeStream: Writable;
    promise: Promise<void>;
  };
  stat(filepath: string): Promise<{
    size: number;
  }>;
  copyFile(src: string, dest: string): Promise<void>;
  rm(path: string): Promise<void>;
  writeFile(dest: string, data: Buffer | string): Promise<void>;
  readFile(path: string): Promise<Buffer>;
  readStream(path: string): Promise<Readable>;
  writeStream(dest: string, stream: Readable): Promise<void>;
  rename(src: string, dest: string): Promise<void>;
}
export default {
  multer: CustomStorageEngine,
  S3: { S3_FS, InitS3 },
  NODE: { NODE_FS, InitNode },
};
