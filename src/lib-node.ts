import { Readable, Stream } from "stream";
import { FSInterface } from "./lib";
import { join, isAbsolute, parse } from "path";
import promises from "fs/promises";
import fs from "fs";

let Root: string;

const sanitizedPath = async (path: string) => {
  const original = path;
  if (isAbsolute(path)) {
    path = join(Root, path);
    await promises.mkdir(parse(path).dir, { recursive: true });
    return path;
  }
  throw `${original} is not an absolute path!`;
};

export const Init = (root: string) => {
  Root = root;
};

const uploadStream = (dest: string) => {
  const pass = new Stream.PassThrough();
  return {
    writeStream: pass,
    promise: writeStream(dest, pass),
  };
};

const stat = async (path: string) => {
  path = await sanitizedPath(path);
  const metadata = await promises.stat(path);
  return { size: metadata.size };
};

const copyFile = async (src: string, dest: string) => {
  src = await sanitizedPath(src);
  dest = await sanitizedPath(dest);
  await promises.copyFile(src, dest);
};

const rm = async (path: string) => {
  path = await sanitizedPath(path);
  await promises.rm(path);
};

const writeFile = async (path: string, data: Buffer | string) => {
  path = await sanitizedPath(path);
  await promises.writeFile(path, data);
};

const readFile = async (path: string) => {
  path = await sanitizedPath(path);
  return promises.readFile(path);
};

const readStream = async (path: string) => {
  path = await sanitizedPath(path);
  return fs.createReadStream(path);
};

const writeStream = async (dest: string, stream: Readable) => {
  dest = await sanitizedPath(dest);
  const writeStream = fs.createWriteStream(dest);
  const done = new Promise((res, rej) => {
    stream.on("end", res);
    stream.on("error", rej);
  });
  stream.pipe(writeStream);
  await done;
};

const rename = async (src: string, dest: string) => {
  await copyFile(src, dest);
  await rm(src);
};

const FS: FSInterface = {
  uploadStream,
  stat,
  copyFile,
  rm,
  writeFile,
  readFile,
  readStream,
  writeStream,
  rename,
};

export default FS;
