# r4dl

Downloads a radio4000 radio.

## How to use

You need to have node and homebrew installed. Then run:

1. `brew install youtube-dl`
2. `npm start https://radio4000.com/ifeveryoneelseforgets`

## Tests

`npm test`

## Credits

- https://github.com/segmentio/nightmare/
- https://github.com/rg3/youtube-dl/

## Alternatives

If you have `jq` installed, you can also skip this project and do:

`curl https://api.radio4000.com/v1/channels/-JYZtdQfLSl6sUpyIJx6/tracks | jq -r '.[] | .url' | youtube-dl -ixa /dev/stdin --audio-format mp3`

... if you haven't got jq, try this:

`curl https://api.radio4000.com/v1/channels/-JYZtdQfLSl6sUpyIJx6/tracks | python -m json.tool | grep -oP '"url": "\K(.+)",' | youtube-dl -a /dev/stdin --extract-audio --audio-format mp3`
