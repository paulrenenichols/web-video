# Project Overview

The goal of this project is to build an application that records video from the browser. The user can click a record button to start recording video, and they can click a button to stop recording video. We also want the application to be able to track the position of facial features so that we can overlay images onto facial features, as you can do in snapchat, so that these overlays are part of the video recording.

## Phase 1: Video recording

The application shows a component displaying what is seen by the user's camera. There is a button below the video component that says "Record" when the application is not recording, and it says "Stop" when the application is recording. When the user clicks "Record", video and audio starts getting recorded. When the user clicks "Stop", the video stops recording and the user is prompted to provide a filename and save the video to their computer.

## Phase 2: Facial Tracking

The app now has the ability to track the users face and facial features within the video. There is a button next to the "Record/Stop" button called "Show Face Tracking". When "Show Face Tracking" is clicked, its text changes to "Hide Face Tracking" and outlines appear with labels showing the facial features being tracked. When "Hide Face Tracking" is clicked, the outlines and labels disappear.

## Phase 3: Overlay Images

In this phase, we want to be able to use facial tracking to display glasses on the eyes of the user and/or a hat on top of the user's head. For this we want to add a dropdown menu of check boxes with labels, one for glasses, and one for hat. When these are clicked, the glasses appear and/or the hat appear on the user.
