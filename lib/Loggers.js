const colors = require("colors");
const dateFormat = require("date-and-time");

module.exports = log = {
    debug: (body) => {
        if(process.env.DEBUG) {
            console.log(getTime() + " | " + colors.cyan(`debug: ${body}`));
            logToDB(body, "debug");
        }
    },
    verbos: (body) => {
        console.log(getTime() + " | " + colors.magenta(`verbos: ${body}`));
        logToDB(body, "verbos");
    },
    error: (body) => {
        console.log(getTime() + " | " + colors.red(`error: ${body}`));
        logToDB(body, "error");
    },
}

/**
 * 
 * @param {any} body 
 * @param {"verbos" | "debug" | "error"} type 
 * @deprecated
 */
function logToDB(body, type) {
    /*if(!process.env.DEBUG) {
        new Loggers({
            message: body,
            type: type
        }).save();
    }*/
    return;
}

function getTime() {
    const D_CurrentDate = new Date();

    let S_FixedDate = dateFormat.format(D_CurrentDate, "YYYY-MM-DD HH:mm:ss");
    return S_FixedDate;
}