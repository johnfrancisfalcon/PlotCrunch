import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Configure fluent-ffmpeg to use ffmpeg-static binary
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
}

export function probe(inputPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
}

export function makePreviewClip(inputPath: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // 5s clip, 1280x720 crop, scaled to width 1280 maintaining aspect ratio, 30fps, no audio, faststart
        ffmpeg(inputPath)
            .setStartTime(0)
            .duration(5)
            .videoFilters([
                // Scale to width=1280 preserving aspect ratio, then crop to 1280x720 centered
                'scale=1280:-2',
                'crop=1280:720'
            ])
            .fps(30)
            .noAudio()
            .outputOptions(['-movflags', 'faststart'])
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .save(outPath);
    });
}


