# write a custom script
It's plain old javascript. To write to the console output, use `stdout('message')`. If you're connecting to an external endpoint, domian should be defined in the `definition.json` file. If you need to edit the html of the output pane (like appending a twitter login button) write the html to stdout.

# install a custom script
```sh
termish install <definition url>
```
ex: `termish install https://rawgit.com/ncthis/0a905be2372e62756f96/raw/61275089d60d117733b2d362863c3ab8718f5182/contributors.json`

NOTE: definition url must be served with `Content-Type: application/json` header.

# run the script
```sh
<command name> <arguments>
```
ex: `ghcontribs3 ncthis/hackertalk`

# definition format
```json
{
    "name": "ghcontribs3",
    "endpoints": ["api.github.com"],
    "scriptUrl": "https://rawgit.com/ncthis/6fa481eaceaf96ef6394/raw/0d8db4b2c6db266fed87b63d955d2947e2b1f0f2/contibutors.js" // must be served with the header 'Content-type: text/javascript'
}