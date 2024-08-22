const express = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

const app = express();
const port = 3000;

app.use(express.json());

app.use(express.static('public'));

async function fetchPictures(url) {
    try {
        const response = await fetch(url);
        const body = await response.text();
        const sign = cheerio.load(body);
        const imageUrls = [];

        sign('img').each((index, elem) => {
            let imageURL = sign(elem).attr('src');
            if(imageURL && !imageURL.startsWith('data:') && !imageURL.includes('#')) {
                

                // Filter or modify the URLs to get the correct image URL if needed
                if (imageURL.includes('thumbnail?name=')) {
                    imageURL = imageURL.replace('/thumbnail?name=', 'memes/');
                }
                const absImgUrl = new URL(imageURL, url).href;
                imageUrls.push(absImgUrl);
            }
        });

        return imageUrls;

    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    } 
}

async function allPages(websiteURL, totalPages) {  // Corrected function signature
    const allImages = [];
    for(let page = 1; page <= totalPages; page++) {
        const pageURL = `${websiteURL}&page=${page}`;
        const images = await fetchPictures(pageURL);
        allImages.push(...images);
    }
    return allImages;
}

// API route: JSON images
app.get('/api/images', async (req, res) => {
    const totalPages = parseInt(req.query.pages) || 1; // Page numbers param
    const websiteURL = req.query.url;

    if(!websiteURL) {
        return res.status(400).json({error: 'Enter valid url '});
    }

    const images = await allPages(websiteURL, totalPages);
    res.json(images);
});

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page.html'));
    // const totalPages = parseInt(req.query.pages) || 1; // Page numbers param
    // const websiteURL = 'http://apimeme.com/?ref=apilist.fun'; // Fixed URL, can be dynamic using query params

    // const images = await allPages(websiteURL, totalPages);
    
    // const html = `
    //     <!DOCTYPE html>
    //     <html lang="en">
    //     <head>
    //         <meta charset="UTF-8">
    //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //         <title>Image Gallery</title>
    //         <style>
    //             body {
    //                 font-family: Arial, sans-serif;
    //             }
    //             .gallery {
    //                 display: flex;
    //                 flex-wrap: wrap;
    //                 gap: 10px;
    //             }
    //             .gallery img {
    //                 max-width: 200px;
    //                 max-height: 200px;
    //                 object-fit: cover;
    //             }
    //         </style>
    //     </head>
    //     <body>
    //         <h1>Image Gallery</h1>
    //         <div class="gallery">
    //             ${images.map(imgUrl => `<img src="${imgUrl}" alt="Image"/>`).join('')}
    //         </div>
    //     </body>
    //     </html>
    // `;

    // res.send(html);
});

app.listen(port, () => {
    console.log("Server Listening on PORT:", port);
});
