# Linkclump

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/9e38a24d7f524c6ca73c07e8948d58a7)](https://www.codacy.com/manual/benblack86/linkclump?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=benblack86/linkclump&amp;utm_campaign=Badge_Grade)

## Support
Support is not provided as this is a free extension.

## Installation
Install it by visiting the [chrome web store](https://chrome.google.com/webstore/detail/linkclump/lfpjkncokllnfokkgpkobnkbkmelfefj).

## Build
The build process uses ant (run `ant` at the command line) and will run tests and create a zip file that can be uploaded to the chrome store. From docker:

```
docker run --mount type=bind,source="$(pwd)",target=/app frekele/ant:1.10.3-jdk8u111 ant -f /app/build.xml
```
