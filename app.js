const pass = require("../password");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const { createReadStream } = require("fs");

//middleware
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.use(cors());

const mongoUri = `mongodb+srv://asbaghel:----@cluster0-prezq.mongodb.net/db9?retryWrites=true&w=majority`;
const conn = mongoose.createConnection(mongoUri);
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

//create  storage engine

const storage = new GridFsStorage({
  url: mongoUri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), (req, res) => {
  console.log("this is consolelog", req.file);
  res.json({ file: req.file });
});

app.get("/files/", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if (!files || files.lenght === 0) {
      return res.status(404).json({
        err: "No files exsist",
      });
    }

    return res.json(files);
  });
});

app.get("/files/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.lenght === 0) {
      return res.status(404).json({
        err: "No file exsist",
      });
    }

    return res.json(file);
  });
});

app.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.lenght === 0) {
      return res.status(404).json({
        err: "No file exsist",
      });
    }

    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({ err: "Not ans img" });
    }
  });
});
const port = 5000;
app.listen(port, () => console.log(`listenig on ${port}`));
