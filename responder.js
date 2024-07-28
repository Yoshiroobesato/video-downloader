require('dotenv').config();
const axios = require('axios');
const readline = require('readline-sync');
const fs = require('fs');
const sanitize = require('sanitize-filename');

const API_KEY = process.env.YOUTUBE_API_KEY;

const getVideoDetails = async (videoId) => {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
            part: 'snippet,contentDetails',
            id: videoId,
            key: API_KEY
        }
    });
    return response.data.items[0];
};

const getDownloadUrl = async (videoUrl) => {
    const response = await axios.get('https://sitecteatemacro.000webhostapp.com/downloader.php', {
        params: { url: videoUrl }
    });
    return response.data.video_url;
};

const downloadVideo = async (downloadUrl, title) => {
    const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream'
    });

    const sanitizedTitle = sanitize(title) || 'video';
    const filePath = `./${sanitizedTitle}.mp4`;

    const writer = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let totalLength = parseInt(response.headers['content-length'], 10);
        let downloadedLength = 0;

        response.data.on('data', (chunk) => {
            downloadedLength += chunk.length;
            const progress = ((downloadedLength / totalLength) * 100).toFixed(2);
            process.stdout.write(`\rProgress: ${progress}%`);
        });

        writer.on('finish', () => {
            console.log('\nDownload complete.');
            resolve();
        });

        writer.on('error', (error) => {
            reject(error);
        });
    });
};

const main = async () => {
    const videoUrl = readline.question('Introduce la URL del video de YouTube: ');
    const videoId = extractVideoId(videoUrl);

    try {
        const videoDetails = await getVideoDetails(videoId);
        console.log(`Título: ${videoDetails.snippet.title}`);
        console.log(`Autor: ${videoDetails.snippet.channelTitle}`);
        console.log(`Descripción: ${videoDetails.snippet.description}`);

        const downloadPrompt = readline.question('¿Descargar video? (y/n): ').toLowerCase();
        if (downloadPrompt === 'y') {
            const downloadUrl = await getDownloadUrl(videoUrl);
            if (downloadUrl) {
                await downloadVideo(downloadUrl, videoDetails.snippet.title);
            } else {
                console.log('No se encontró una URL de descarga en la respuesta.');
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

const extractVideoId = (url) => {
    const longUrlPattern = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
    const shortUrlPattern = /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/;

    let match = url.match(longUrlPattern);
    if (match) {
        return match[1];
    }

    match = url.match(shortUrlPattern);
    if (match) {
        return match[1];
    }

    throw new Error("No se pudo extraer el videoId de la URL.");
};

main();
