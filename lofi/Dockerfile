FROM ubuntu:20.04

RUN apt-get update && apt-get install -y \
    ffmpeg

WORKDIR /app

COPY playlist.txt /app/playlist.txt
COPY music /app/music

CMD ["ffmpeg", "-re", "-stream_loop", "-1", "-f", "concat", "-safe", "0", "-i", "/app/playlist.txt", "-f", "mp3", "-content_type", "audio/mpeg", "icecast://source:ice@lofi-icecast:8000/lofi"]
