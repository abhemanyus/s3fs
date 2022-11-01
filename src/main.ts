import { Filesystem, S3Filesystem, DirPath, Directory } from "./lib";

const fs: Filesystem = new S3Filesystem({
  secretAccessKey: "ofsjdoi[fjoisdjoids",
  accessKeyId: "hfjgyjyuvb",
  bucket: "bucket",
  region: "us-east-1",
});

async function main() {
  const file = new DirPath(Directory.ROOT, "test");
  await fs.writeFile(file, "hello how are you?");
  const data = (await fs.readFile(file)).toString();
  console.log(data);
}

main()
  .then(() => console.log("completed"))
  .catch(console.error);
