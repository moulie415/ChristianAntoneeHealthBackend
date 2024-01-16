import sharp from 'sharp';
import { bucket, db } from '.';

export const resizeRecipeImages = async () => {

  const folders = await  bucket.getFiles({prefix: 'recipes'});
  for (const folder of folders) {
    for (const file of folder) {
      const paths = file.name.split('/')
      const fileName = paths[2];

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
        const path = paths.slice(0, 2).join('/');
        const doc = await db.doc(path).get();
        
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491'
        });

        if (url && doc && doc.data()) {
          const updateObj = { ...doc.data()?.image, src: url }
          await db.doc(path).update({ image: updateObj })
          console.log(`recipe image ${paths[1]} updated`)
        } else {
          console.log(`recipe image ${paths[2]} not updated`)
        }
      } else if (fileName === 'recipe.pdf') {
      }
    }
  }
}