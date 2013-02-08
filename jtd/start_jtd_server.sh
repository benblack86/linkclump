#! /bin/bash


# step 1 start server (will use config file found in the same directory)
java -jar jsTestDriver-1.3.5.jar --port 9879 --basePath ../ --browser open
