import FS  from "./lib";
import fs from "fs";

async function main() {
  const { writeStream, promise } = FS.uploadStream("/text/lazy_rabbit.txt");
  const readStream = fs.createReadStream("./help.txt");
  readStream.pipe(writeStream);

  const result = await promise;
  console.log("upload", result);

  const copy = await FS.copyFile("/text/lazy_rabbit.txt", "/text/fast_tortoise");
  console.log("copy", copy);

  const deleted = await FS.rm("/text/fast_tortoise");
  console.log("deleted", deleted);

  const stats = await FS.stat("/text/lazy_rabbit.txt");
  console.log("stats", stats);

  const read = await FS.readFile("/text/lazy_rabbit.txt");
  console.log(read.toString());
  const write = await FS.writeStream("/text/lazy_fox.txt", readStream);
  console.log(write);
  await FS.rename("/text/lazy_fox.txt", "/text/fast_tortoise.txt");
}
main();
