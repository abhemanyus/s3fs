import express from "express";
import multer from "multer";
import CustomStorageEngine from "./multer-s3";

const app = express();
const uploader = multer({
  storage: new CustomStorageEngine({
    destination: "/tmp",
  }),
});
app.post("/upload", uploader.single("file"), (req, res) => {
  res.send(req.file?.filename);
});

app.listen(3000, () => console.log("App is listening on port 3000"));
