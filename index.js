const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const Jimp = require('jimp');

const app = express();
const PORT = 4000;

// Enhance image resolution by resizing and applying filters
const enhanceImageResolution = async (imageUrl, scaleFactor) => {
  try {
    const image = await Jimp.read(imageUrl);

    // Log the original image size
    console.log(`Original Image Size: ${image.bitmap.width}x${image.bitmap.height}`);

    // Scale the image
    image.scale(scaleFactor);

    // Log the new image size after scaling
    console.log(`New Image Size: ${image.bitmap.width}x${image.bitmap.height}`);

    // Apply sharpening filter
    image.convolute([
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0]
    ]);

    // Return the processed image buffer
    return await image.getBufferAsync(Jimp.MIME_JPEG);
  } catch (error) {
    console.error(`Error enhancing image ${imageUrl}:`, error.message);
    return null;
  }
};

// Fetch meme images from a specific page
const fetchMemeImagesFromPage = async (pageNumber) => {
  try {
    const response = await fetch(`http://apimeme.com/?ref=apilist.fun&page=${pageNumber}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const memeUrls = [];

    $('img').each((index, element) => {
      let imgSrc = $(element).attr('src');
      if (imgSrc && !imgSrc.startsWith('data:')) {
        if (imgSrc.startsWith('http')) {
          memeUrls.push(imgSrc);
        } else {
          const fullUrl = `http://apimeme.com${imgSrc}`;
          memeUrls.push(fullUrl);
        }
      }
    });

    return memeUrls;
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error.message);
    return [];
  }
};

app.get('/api/images', async (req, res) => {
  try {
    const pagePromises = [];
    for (let page = 1; page <= 29; page++) {
      pagePromises.push(fetchMemeImagesFromPage(page));
    }

    const results = await Promise.all(pagePromises);
    const allMemeUrls = results.flat();

    // Randomly select 4 images
    const randomMemeUrls = allMemeUrls.sort(() => 0.5 - Math.random()).slice(0, 4);

    const enhancedImagePromises = randomMemeUrls.map(url => enhanceImageResolution(url, 2));
    const enhancedImagesBuffers = await Promise.all(enhancedImagePromises);

    const enhancedImages = enhancedImagesBuffers
      .filter(buffer => buffer)
      .map(buffer => `data:image/jpeg;base64,${buffer.toString('base64')}`);

    if (enhancedImages.length > 0) {
      res.json({
        status: 'success',
        data: enhancedImages
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to enhance images'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching memes',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
