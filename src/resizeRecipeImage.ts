import sharp from 'sharp';
import { bucket } from '.';

export const resizeRecipeImages = async () => {

  const folders = await  bucket.getFiles({prefix: 'recipes'});
  for (const folder of folders) {
    for (const file of folder) {
    
      console.log(file.name)
      const fileName = file.name.split('/')[2];

      console.log(fileName)

      if (fileName === 'image.jpg') {
      
        const imageWidth = 1280
        
        console.log('creating write stream')
        // Create write stream for uploading thumbnail
        const uploadStream = file.createWriteStream();

        // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
        const pipeline = sharp();

        // Perform the resize operation
        pipeline
          .resize({ width: imageWidth, fit: sharp.fit.contain })    
          .jpeg()
          .pipe(uploadStream);


        file.createReadStream().pipe(pipeline);
        
        console.log('uploading to write stream')
        await new Promise((resolve, reject) =>
          uploadStream.on('finish', resolve).on('error', reject)
        );
        console.log(`finished resizing ${file.name}`)
        
      }
    }
  }
}