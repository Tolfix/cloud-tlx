const crypto = require("crypto");
const multer = require("multer");
const gridFsStorage = require("multer-gridfs-storage");
const path = require("path");
const log = require("./Loggers");

// Create storage engine
const storage = new gridFsStorage({
    url: process.env.MONGODB_NAV,
    options: {
        useUnifiedTopology: true
    },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                };

                const filename = buf.toString('hex') + path.extname(file.originalname);

                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };

                resolve(fileInfo);
            });
        });
    }
});

storage.on("file", (file) => {
    log.verbos(`New file was created with data: ` + JSON.stringify(file));
});

storage.on("streamError", (error, conf) => {
    log.error(error)
});

const upload = multer({ storage: storage });

module.exports = upload;