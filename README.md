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
## Features
Linkclump is a free chrome extension which allows users to open multiple links at once by draging a selection box over them.
To create a selection box, press and hold the z key on your keyboard while holding the left mouse button, then drag your cursor over the links that you want to open.

Linkclump also has several customizable features.
These features can be accessed through chrome by going to chrome://extensions, clicking on the Linkclump extension, add clicking "Extension Options".
(There is one exception, whether Linkclump can open file URLs or not. This can be accessed instead by going to chrome://extensions, clicking on the Linkclump extension, and clicking "Allow Access to file URLs.")
Through the feature Menu, several things can be changed:
1) Specific Sites can be blacklisted from linkclump usage by providing their URLs.
2) The default action keybind can be changed. Z can be changed to any other alphabetical key, shift, crtl, and alt. Left Click can be changed to any Mouse Button.
3) The selection action can be modified: whether links should be opened as new tabs or new windows, whether there is delay time in opening and closing new tabs, the order in which tabs are opened, and several other customizable features.
4) New selection actions can be specified, so that you may have any number of specific selection types attached to different keys and mouse inputs.

## Project Structure
linkclump
    -> .github: Contains information on issue requests and workflows for the project
        -> ISSUE_TEMPLATE: Contains the issue template that should be used for github requests
        -> workflows: Contains information on how to close stale issues on github
    -> examples: Contains an html file which has an example for opening links on a local file
    -> jtd: Contains JSTestDriver files, which allows running tests for the system
    -> media: Contains most of the images and style data for the project
    -> src: Contains the majority of the code for the extension
        -> images: Contains more images for use in the project
        -> libs: Contains the libraries used in the project
            -> colorpicker: Contains the colorpicker library use in the project, developed by Matthew Hailwood
        -> pages: Contains the html and style code for the project
    -> src-test: Contains tests for the extension
    (other files): Contains miscellaneous files, such as build files, license files, package files, and README file

## Known Issues
Time delay does not work correctly with the "opened in a new window" option. The first two links open simultaneously.

## License
MIT License, Copyright (c) 2015 Benjamin Black. See LICENSE.md for more information.