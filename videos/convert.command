

## ffmpeg 4.4_2 is already installed and up-to-date.
## which gifsicle /opt/homebrew/bin/gifsicle
## which ffmpeg /opt/homebrew/bin/ffmpeg
## https://www.lcdf.org/gifsicle/man.html
## https://tyhopp.com/notes/ffmpeg-crosshatch

## 2526×2304
## 1280x1184

## -r 10 tells ffmpeg to reduce the frame rate from 25 fps to 10
## -s 600x400 tells ffmpeg the max-width and max-height
## --delay=3 tells gifsicle to delay 30ms between each gif
## --optimize=3 requests that gifsicle use the slowest/most file-size optimization


## ffmpeg -i recording.01.mp4 -s 1280x1184 -pix_fmt rgb8 paletteuse=dither=none -r 10 -f gif - | gifsicle --colors=32 --optimize=3 --delay=3 > recording.01.gif

##ffmpeg -y -i recording.01.mp4 -vf palettegen palette.png
##ffmpeg -y -i recording.01.mp4 -s 1280x1184 -i palette.png -lavfi paletteuse=dither=none -pix_fmt rgb8 -r 10 recording.01.gif

ffmpeg -y -i recording.01.mov -vf palettegen palette.png
ffmpeg -y -i recording.01.mov -i palette.png -s 1440x900 -sws_flags neighbor -filter_complex paletteuse=dither=none -r 10 -f gif - | gifsicle --colors=16 --optimize=3 --delay=10 > recording.01.gif

ffmpeg -y -i recording.01.mov -i palette.png -s 1440x900 -sws_flags neighbor -filter_complex paletteuse=dither=none -r 10 -f gif -o recording.00.gif

gifsicle --colors=64 --optimize=3 --delay=10 --resize-fit 1440x900 --resize-method box --use-colormap palette.gif recording.00.gif > recording.01.gif