import { Readable, Writable } from "stream";

import S3_FS, { Init as InitS3 } from "./lib-aws";
import NODE_FS, { Init as InitNode } from "./lib-node";

let FS: FSInterface;

if (process.env.STORAGE == "S3") {
    FS = S3_FS;
    InitS3({
        accessKeyId: "supersecretkey",
        secretAccessKey: "supersecretkey",
        bucket: "superbucket",
        region: "australia"
    });
} else {
    FS = NODE_FS;
    InitNode("/tmp");
}

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

export default FS;

