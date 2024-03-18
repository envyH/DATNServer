require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
// const fs = require('fs');

const { admin } = require('../configs/firebase/index');
// Cloud  storage
const bucket = admin.storage().bucket(process.env.BUCKET);

class FirebaseService {
    createFoldersIfNotExist = async (...folders) => {
        for (const folder of folders) {
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }
        }
    }

    deleteFolderAndFiles = async (res, folderPath) => {
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

    uploadImage = async (id, fileType, folder, fileItem) => {
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
                console.log(`uploadImage: ${e.message}`);
                reject("0");
            }
        });
    }

}

module.exports = new FirebaseService;
