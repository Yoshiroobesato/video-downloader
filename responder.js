require('dotenv').config();
const readline = require('readline');
const axios = require('axios');
const fs = require('fs');
const progress = require('progress');
const sanitizeFilename = require('sanitize-filename');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_KEY = process.env.YOUTUBE_API_KEY;

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function extractVideoId(url) {
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
}

async function fetchVideoDetails(videoId) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet,contentDetails',
                id: videoId,
                key: API_KEY
            }
        });
        return response.data.items[0];
    } catch (error) {
        console.error("Error al hacer la solicitud:", error.message);
    }
}

async function requestDownloadUrl(videoUrl) {
    try {
        const response = await axios.get(`https://sitecteatemacro.000webhostapp.com/downloader.php`, {
            params: { url: videoUrl }
        });
        return response.data;
    } catch (error) {
        console.error("Error al solicitar la URL de descarga:", error.message);
    }
}

async function downloadVideo(videoUrl, title) {
    try {
        console.log("Iniciando la descarga...");
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const totalLength = response.headers['content-length'];
        const sanitizedTitle = sanitizeFilename(title);
        const filePath = `${sanitizedTitle}.mp4`;
        const progressBar = new progress('Descargando [:bar] :percent :etas', {
            width: 40,
            total: parseInt(totalLength, 10)
        });

        response.data.on('data', chunk => progressBar.tick(chunk.length));
        response.data.pipe(fs.createWriteStream(filePath));

        response.data.on('end', () => {
            console.log(`Descarga completa. El video se guardó como ${filePath}`);
        });
    } catch (error) {
        console.error("Error al descargar el video:", error.message);
    }
}

async function main() {
    const videoUrl = await askQuestion("Introduce la URL del video de YouTube: ");
    const videoId = extractVideoId(videoUrl);

    const videoDetails = await fetchVideoDetails(videoId);

    if (videoDetails) {
        console.log(`Título del video: ${videoDetails.snippet.title}`);
        console.log(`Autor: ${videoDetails.snippet.channelTitle}`);
        console.log(`Descripción: ${videoDetails.snippet.description}`);
        console.log(`Duración: ${videoDetails.contentDetails.duration}`);
        console.log(`Fecha de publicación: ${videoDetails.snippet.publishedAt}`);
        
        const downloadOption = await askQuestion("¿Descargar video? (y/n): ");
        if (downloadOption.toLowerCase() === 'y') {
            const jsonResponse = await requestDownloadUrl(videoUrl);
            if (jsonResponse && jsonResponse.video_url) {
                await downloadVideo(jsonResponse.video_url, videoDetails.snippet.title);
            } else {
                console.log("No se encontró una URL de descarga en la respuesta.");
            }
        } else {
            console.log("No se descargó el video.");
        }
    } else {
        console.log("No se encontró información del video.");
    }

    rl.close();
}

main();
