const express = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.static('public'));

async function fetchPictures(url) {
    try {
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);
        const imageUrls = [];

        $('img').each((index, elem) => {
            let imageURL = $(elem).attr('src');
            if (imageURL && !imageURL.startsWith('data:') && !imageURL.includes('#')) {
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

async function allPages(websiteURL, totalPages) {
    const allImages = [];
    for (let page = 1; page <= totalPages; page++) {
        const pageURL = `${websiteURL}&page=${page}`;
        const images = await fetchPictures(pageURL);
        allImages.push(...images);
    }
    return allImages;
}

app.get('/api/images', async (req, res) => {
    const totalPages = parseInt(req.query.pages) || 1;
    const websiteURL = req.query.url;

    if (!websiteURL) {
        return res.status(400).json({
            status: 'error',
            data: 'Geçerli URL giriniz.'
        });
    }

    const images = await allPages(websiteURL, totalPages);

    if (images.length > 0) {
        res.json({
            status: 'success',
            data: images
        });
    } else {
        res.json({
            status: 'resim bulunamadı',
            data: 'Bu URL ye ait resim bulunamadı.'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page.html'));
});

app.listen(port, () => {
    console.log("Server Listening on port:", port);
});