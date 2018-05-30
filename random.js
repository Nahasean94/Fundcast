const fs =require( 'fs')
const mkdirp =require( 'mkdirp')
const shortid =require( 'shortid')

const uploadDir = './uploads'

// Ensure upload directory exists
mkdirp.sync(uploadDir)

const storeFS = ({ stream, filename }) => {
    const id = shortid.generate()
    const path = `${uploadDir}/${id}-${filename}`
    return new Promise((resolve, reject) =>
        stream
            .on('error', error => {
                if (stream.truncated)
                // Delete the truncated file
                    fs.unlinkSync(path)
                reject(error)
            })
            .pipe(fs.createWriteStream(path))
            .on('error', error => reject(error))
            .on('finish', () => resolve({ id, path }))
    )
}

const processUpload = async upload => {
    const { stream, filename, mimetype, encoding } = await upload
    const { id, path } = await storeFS({ stream, filename })

}
