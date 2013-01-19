#! /bin/bash


# step 1 start server (doesn't need config file, although will use it when run in the same directory)
java -jar jsTestDriver-1.3.5.jar --port 9877 --basePath ../ --browser open
