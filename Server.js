require('dotenv').config();
const express = require('express');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const log = require("./lib/Loggers");
const upload = require("./lib/Storage");
const flash = require('connect-flash');
const session = require('express-session');

const app = express();

mongoose.connect(process.env.MONGODB_NAV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
let conn = mongoose.connection;

let gfs;

conn.once('open', () => {
    log.verbos("Database connected")
    const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: "uploads"});
    gfs = gridFSBucket;
});

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash());

app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.video = req.flash('video');
    next();
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    gfs.find().toArray((err, files) => {
        let sizeB = files.map(e => e.length)
        let total = 0;
        if(sizeB.length > 0) {

            for (let i = 0; i < sizeB.length; i++) {
                total += sizeB[i]
                if(i+1==sizeB.length) {
                    res.render("main", {
                        storage: total,
                        totalFiles: sizeB.length
                    });
                }
            }
        } else {
            res.render("main", {
                storage: total,
                totalFiles: sizeB.length
            });
        }
    });
});

/*
app.get("/files", (req, res) => {
    gfs.find().toArray((err, files) => {
        res.render("files", {
            files
        });
    });
});
*/

app.get("/file/:file", async (req, res) => {
    let fileName = req.params.file
    if (await gfs.find({ filename: fileName }).count() === 0) {
        req.flash("error_msg", "No file found");
        res.redirect("/")
    } else {
        let image = gfs.openDownloadStreamByName(fileName)
        log.verbos(`File ${fileName} was requested`);
        image.pipe(res)
    }
});

app.get("/video/:video", async (req, res) => {
    let fileName = req.params.video
    if (await gfs.find({ filename: fileName }).count() === 0) {
        req.flash("error_msg", "No file found");
        res.redirect("/")
    } else {
        res.render("video", {
            video: fileName
        })
    }
});

let regexVideo = /mp4|quicktime|x-ms-wmv/g;
let regexImage = /jpeg|gif|jpg|jpeg|png/g;
let regexAudio = /mpeg|wav/g;

app.post("/upload", upload.single("image"), (req, res) => {
    if(req.file) {
        if(
            req.file.contentType.split("/")[1].match(regexVideo) ||
            req.file.contentType.split("/")[1].match(regexImage) ||
            req.file.contentType.split("/")[1].match(regexAudio)

        ) {
            if(!req.file.size < 100000000) {
                if(
                    req.file.contentType.split("/")[1].match(regexVideo)
                ) {
                    log.verbos("Is a video, giving the url.")
                    //req.flash("video", req.file.filename)
                    res.redirect("/video/"+req.file.filename);
                } else {   
                    log.verbos("Redirecting to file");
                    res.redirect("/file/"+req.file.filename);
                }
            } else {
                gfs.delete(req.file.id).then(a => {
                    log.error("File too large.. removing.");
                    req.flash("error_msg", "File too large, max 100 MB");
                    res.redirect("/");
                }).catch(e => {
                    log.error(e);
                    res.redirect("/");
                })
            }
        } else {
            gfs.delete(req.file.id).then(a => {
                log.error("Not allowed file type, user attempted with: " + req.file.contentType);
                req.flash("error_msg", "Only image/video/audio files are allowed.");
                res.redirect("/");
            }).catch(e => {
                log.error(e);
                res.redirect("/");
            })
        }
    } else {
        req.flash("error_msg", "Please submit an image before uploading");
        res.redirect("/");
    }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, log.verbos(`Server started on port ${PORT}`));

app.get('*', (req, res) => {
    res.status(404).render('notFound');
});

if(process.env.JENKINS || process.env.GITHUB_ACTION || process.env.DOCKER_TEST)
{
    setTimeout(() => {
        log.info(`Exiting build.`)
        process.exit(0); // <-- Exit with code 0
    }, 30000) // <--- 30 sec
}