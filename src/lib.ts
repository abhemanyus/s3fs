import Path from "path";
import Fs from "fs";
import { randomUUID } from "crypto";
import { S3Client, HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Writable, Readable, PassThrough } from "stream";
import { buffer } from "stream/consumers";

export enum Directory {
  CSV = "/csv",
  DOCUMENTS = "/documents",
  FLIGHT_LOGS = "/flight_logs",
  ALERT_IMAGES = "/images/alertImages",
  GEOJSON_IMAGES = "/images/geojson",
  PACKAGE_POSTERS = "/images/packagePosters",
  TEMP_IMAGES = "/images/temp",
  LAYER_FILES = "/layerFiles",
  RASTER = "/raster",
  TEMP = "/temp",
  VECTOR = "/vector",
  ZIP = "/zip",
  VOD = "/vod",
  ROOT = "/",
}

export class DirPath {
  private dir: Directory;
  private rel: string;
  constructor(dir: Directory, rel?: string) {
    if (rel == undefined) rel = randomUUID();
    this.dir = dir;
    this.rel = rel;
  }
  public GetPath(root?: string) {
    if (root == undefined) return Path.join(this.dir, this.rel);
    return Path.join(root, this.dir, this.rel);
  }
}

export abstract class Filesystem {
  public abstract uploadStream(dest: DirPath): {
    writeStream: Writable;
    promise: Promise<void>;
  };
  public abstract stat(filepath: DirPath): Promise<{
    size: number;
  }>;
  public abstract copyFile(src: DirPath, dest: DirPath): Promise<void>;
  public abstract rm(path: DirPath): Promise<void>;
  public abstract writeFile(
    dest: DirPath,
    data: Buffer | string
  ): Promise<void>;
  public abstract readFile(path: DirPath): Promise<Buffer>;
  public abstract readStream(path: DirPath): Promise<Readable>;
  public abstract writeStream(
    dest: DirPath,
    stream: Readable
  ): Promise<void>;
  public abstract rename(src: DirPath, dest: DirPath): Promise<void>;
}

export class NativeFilesystem extends Filesystem {
  Root: string;
  constructor(root: string) {
    super();
    this.Root = root;
  }
  public uploadStream(dest: DirPath): {
    writeStream: Writable;
    promise: Promise<void>;
  } {
    const pass = new PassThrough();
    return {
      writeStream: pass,
      promise: this.writeStream(dest, pass),
    };
  }

  public async stat(path: DirPath): Promise<{
    size: number;
  }> {
    const metadata = await Fs.promises.stat(path.GetPath(this.Root));
    return { size: metadata.size };
  }

  public async copyFile(src: DirPath, dest: DirPath): Promise<void> {
    await Fs.promises.copyFile(src.GetPath(this.Root), dest.GetPath(this.Root));
  }

  public async rm(path: DirPath): Promise<void> {
    await Fs.promises.rm(path.GetPath(this.Root));
  }

  public async writeFile(path: DirPath, data: Buffer | string): Promise<void> {
    await Fs.promises.writeFile(path.GetPath(this.Root), data);
  }

  public async readFile(path: DirPath): Promise<Buffer> {
    const buf = await Fs.promises.readFile(path.GetPath(this.Root));
    return buf;
  }

  public async readStream(path: DirPath): Promise<Readable> {
    await new Promise(() => {
      // 1+1;
    });
    return Fs.createReadStream(path.GetPath(this.Root));
  }

  public async writeStream(
    dest: DirPath,
    stream: Readable
  ): Promise<void> {
    const writeStream = Fs.createWriteStream(dest.GetPath(this.Root));
    const done = new Promise((res, rej) => {
      stream.on("end", res);
      stream.on("error", rej);
    });
    stream.pipe(writeStream);
    await done;
  }

  public async rename(src: DirPath, dest: DirPath): Promise<void> {
    await this.copyFile(src, dest);
    await this.rm(src);
  }
}

export class S3Filesystem extends Filesystem {
  Bucket: string;
  Client: S3Client;
  constructor(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  }) {
    super();
    this.Bucket = config.bucket;
    this.Client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      region: config.region,
    });
  }
  public override uploadStream(dest: DirPath): {
    writeStream: Writable;
    promise: Promise<void>;
  } {
    const pass = new PassThrough();
    return {
      writeStream: pass,
      promise: this.writeStream(dest, pass),
    };
  }
  public override async stat(path: DirPath): Promise<{
    size: number;
  }> {
    const metadata = new HeadObjectCommand({
      Bucket: this.Bucket,
      Key: path.GetPath(),
    });
    const output = await this.Client.send(metadata);
    return { size: output.ContentLength as number };
  }

  public override async copyFile(src: DirPath, dest: DirPath): Promise<void> {
    const copy = new CopyObjectCommand({
      Bucket: this.Bucket,
      CopySource: this.Bucket + "/" + src.GetPath(),
      Key: dest.GetPath(),
    });
    await this.Client.send(copy);
  }

  public override async rm(path: DirPath): Promise<void> {
    const deleted = new DeleteObjectCommand({
      Bucket: this.Bucket,
      Key: path.GetPath(),
    });
    await this.Client.send(deleted);
  }

  public override async writeFile(
    path: DirPath,
    data: string | Buffer
  ): Promise<void> {
    const upload = new Upload({
      client: this.Client,
      params: {
        Bucket: this.Bucket,
        Key: path.GetPath(),
        Body: data,
      },
    });
    await upload.done();
  }

  public override async readFile(path: DirPath): Promise<Buffer> {
    const read = await this.readStream(path);
    return buffer(read);
  }

  public override async readStream(path: DirPath): Promise<Readable> {
    const read = new GetObjectCommand({
      Bucket: this.Bucket,
      Key: path.GetPath(),
    });

    const output = await this.Client.send(read);
    return output.Body as Readable;
  }

  public override async writeStream(
    dest: DirPath,
    stream: Readable
  ): Promise<void> {
    const upload = new Upload({
      client: this.Client,
      params: {
        Bucket: this.Bucket,
        Key: dest.GetPath(),
        Body: stream,
      },
    });
    await upload.done();
  }

  public override async rename(src: DirPath, dest: DirPath): Promise<void> {
    await this.copyFile(src, dest);
    await this.rm(src);
  }
}
