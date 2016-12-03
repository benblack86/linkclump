# Linkclump

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/9e38a24d7f524c6ca73c07e8948d58a7)](https://www.codacy.com/app/benblack86/linkclump?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=benblack86/linkclump&amp;utm_campaign=Badge_Grade)

## Build
The build process uses ant (run `ant` at the command line) and will run tests and create a zip file that can be uploaded to the chrome store.

## Changelog

### v2.7.3
+ Fixed bug with bookmarking in non-english languages
+ Moved troubleshooting to the options page

### v2.7.0
+ Did some basic refactoring and creating SettingsManager

### v2.5.0
+ Open links that only include any/all words

### v2.4.0
+ Allowed home/end buttons to be pressed
+ Added link count
+ Updated files to new chrome standard
+ Fixed interference with spell checker

### v2.3.0
+ Open tabs after current tab
+ Allowed new window to open behind
+ Added close tab time

### v2.2.1
+ Ignore words now works on href and innerHTML

### v2.1.1
+ Fixed scrolling bug issue 
+ Improved scrolling by monitoring mouse out event

### v2.0.17
+ Set "block repeat links in selection" to default to true
+ Allowed floats for the delay

### v2.0.16
+ Delayed mouse up clean up to deal with "bouncing"

### v2.0.11
+ Options page revamped to allow multiple actions
+ Added ability to copy to clipboard and bookmark

### v1.6
+ GUI changes to allow greater option flexibility

### v1.5
+ linkclump box appearing on mouse move on lazy mouse fix

### v1.4
+ fixed background bug
+ removed some jquery code that was too slow

### v1.1.0
+ convert more code to jquery
+ fixed linkclump box wondering
+ improved image dimension finding
+ adding pop-up setup guide on first install
+ improved description

### v1.0.6
+ scroll functionality
+ using jquery 1.4.4 for improved dimensions calculations
+ if link surrounds an image then image dimensions are used
+ moved options to options page
+ improved design

### v1.0.3
+ new window feature added
+ ability to open with shift/alt/ctrl

### v1.0.2
+ exclude words feature added

### v1.0.1
+ smart select added

### v1.0.0
+ allows the user to open multiple links at once
