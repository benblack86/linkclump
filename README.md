# Linkclump

## Support
Support is not provided as this is a free extension.

## Installation
Install it by:
visiting the [chrome web store](https://chrome.google.com/webstore/detail/linkclump/lfpjkncokllnfokkgpkobnkbkmelfefj)
or
visiting the [mozilla addon store (coming soon)](https://addons.mozilla.org)

## Build
The build process uses ant (run `ant` at the command line) and will run tests and create a zip file that can be uploaded to the chrome store. From docker:

```
docker run --mount type=bind,source="$(pwd)",target=/app frekele/ant:latest ant -f /app/build.xml
```
