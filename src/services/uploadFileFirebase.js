const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
// const fs = require('fs');
const serviceAccount = require("../configs/firebase/config.json");
const { getStorage, getDownloadURL } = require('firebase-admin/storage');
// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
// Cloud  storage
const bucket = admin.storage().bucket('gs://datn-13d57.appspot.com');


// async function createFoldersIfNotExist(...folders) {
//     for (const folder of folders) {
//         if (!fs.existsSync(folder)) {
//             fs.mkdirSync(folder, { recursive: true });
//         }
//     }
// }

exports.uploadFileToFBStorage = async (id, fileType, folder, fileItem) => {
    // category._id.toString(),
    // "",
    // "categories",
    // fileimg
    return new Promise(async (resolve, reject) => {
        try {
            if (!fileItem) {
                return reject("0");
            }
            const dir = `${folder}/${id}`;
            const typeFolder = fileType.length > 0 ? `${dir}/${fileType}` : `${dir}`;

            // await createFoldersIfNotExist(`${folder}`, dir, typeFolder);

            const destinationPath = `${typeFolder}/${fileItem.originalname}`;
            const file = bucket.file(destinationPath);

            await file.save(fileItem.buffer, {
                metadata: { contentType: fileItem.mimetype },
            });

            const token = uuidv4();
            const encodedPath = encodeURIComponent(destinationPath);
            const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

            resolve(fileUrl);
        } catch (e) {
            console.log(e.message);
            reject("0");
        }
    });
};


async function deleteFolderAndFiles(res, folderPath) {
    try {
        const files = await bucket.getFiles({ prefix: folderPath });
        for (const file of files[0]) {
            await file.delete();
        }
        console.log(`Folder ${folderPath} deleted successfully from Firebase Storage`);
    } catch (error) {
        console.error(`Error deleting folder from Firebase Storage: ${error.message}`);
        return res.send({ message: "Error deleting folder", code: 0 });
    }
}
exports.deleteFolderAndFiles = deleteFolderAndFiles;

