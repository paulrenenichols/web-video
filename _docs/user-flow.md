# User Flow Documentation

This document defines the user journey through the web video recording application, covering all phases of functionality from basic video recording to advanced facial tracking with overlays.

## Application Entry Point

### Initial Load

1. **Page Load**: User navigates to the application URL
2. **Camera Permission Request**: Browser prompts user for camera and microphone permissions
3. **Permission Handling**:
   - If granted: Camera feed displays immediately
   - If denied: Error message displayed with instructions to enable permissions
   - If pending: Loading state shown until user responds

## Phase 1: Basic Video Recording

### Camera Setup

1. **Camera Feed Display**: Live camera feed appears in the main video component
2. **Camera Selection** (if multiple cameras available): Dropdown menu allows user to switch between available cameras
3. **Audio Setup**: Microphone indicator shows audio levels when speaking

### Recording Workflow

1. **Pre-Recording State**:

   - "Record" button is visible and enabled
   - Camera feed shows live preview
   - No recording indicator is shown

2. **Start Recording**:

   - User clicks "Record" button
   - Button text changes to "Stop"
   - Recording indicator appears (e.g., red dot, timer)
   - Video and audio recording begins
   - Camera feed continues to show live preview

3. **During Recording**:

   - Recording timer displays elapsed time
   - "Stop" button remains prominent
   - Live preview continues
   - Recording indicator remains visible

4. **Stop Recording**:
   - User clicks "Stop" button
   - Recording stops immediately
   - Button text changes back to "Record"
   - Recording indicator disappears
   - File save dialog appears

### File Management

1. **Save Dialog**:

   - Prompt appears asking for filename
   - Default filename suggested (e.g., "recording_YYYY-MM-DD_HH-MM-SS")
   - User can modify filename
   - File format options (if applicable)

2. **Download Process**:
   - Video file downloads to user's default download folder
   - Success confirmation shown
   - Option to record another video

## Phase 2: Facial Tracking

### Face Tracking Activation

1. **Show Face Tracking Button**:

   - Button appears next to Record/Stop button
   - Initially shows "Show Face Tracking" text
   - Only enabled when camera feed is active

2. **Enable Face Tracking**:

   - User clicks "Show Face Tracking" button
   - Button text changes to "Hide Face Tracking"
   - Facial feature outlines appear on video feed
   - Labels show tracked features (eyes, nose, mouth, etc.)

3. **Face Tracking Display**:

   - Real-time outlines follow facial movements
   - Feature labels remain visible
   - Tracking accuracy indicator (optional)

4. **Disable Face Tracking**:
   - User clicks "Hide Face Tracking" button
   - Button text changes back to "Show Face Tracking"
   - Outlines and labels disappear
   - Camera feed returns to normal view

### Face Tracking States

1. **Face Detected**: Outlines and labels visible, tracking active
2. **Face Not Detected**: Outlines disappear, "No face detected" message shown
3. **Multiple Faces**: Outlines for all detected faces, primary face highlighted
4. **Poor Lighting**: Warning message about lighting conditions

## Phase 3: Overlay Images

### Overlay Controls

1. **Overlay Menu**:

   - Dropdown menu appears with overlay options
   - Checkboxes for each overlay type (glasses, hat)
   - Menu can be expanded/collapsed

2. **Overlay Selection**:
   - User checks/unchecks overlay options
   - Changes apply immediately to video feed
   - Multiple overlays can be active simultaneously

### Overlay Display

1. **Glasses Overlay**:

   - When checked: Glasses appear positioned over user's eyes
   - Glasses follow head movements and rotations
   - Size adjusts based on face size and distance
   - When unchecked: Glasses disappear

2. **Hat Overlay**:
   - When checked: Hat appears positioned on top of user's head
   - Hat follows head movements and rotations
   - Size adjusts based on head size and distance
   - When unchecked: Hat disappears

### Overlay Interaction

1. **Real-time Positioning**: Overlays automatically position themselves based on facial tracking
2. **Movement Tracking**: Overlays move with user's head movements
3. **Recording Integration**: Overlays are included in recorded video
4. **Combination Effects**: Multiple overlays work together (glasses + hat simultaneously)

## Error Handling and Edge Cases

### Permission Issues

1. **Camera Denied**: Clear error message with instructions to enable camera
2. **Microphone Denied**: Warning that audio recording won't work
3. **Permissions Revoked**: Detect and prompt for re-enabling

### Technical Issues

1. **Camera Unavailable**: Fallback message and troubleshooting steps
2. **Recording Failed**: Error message with retry option
3. **Face Tracking Unavailable**: Graceful degradation to basic recording
4. **Overlay Loading Failed**: Individual overlay disabled with error message

### User Experience Considerations

1. **Loading States**: Clear indicators during camera initialization, face tracking setup
2. **Performance**: Smooth video feed even with overlays active
3. **Accessibility**: Keyboard navigation, screen reader support
4. **Mobile Responsiveness**: Touch-friendly controls for mobile devices

## State Management

### Application States

1. **Initializing**: Loading camera and permissions
2. **Ready**: Camera active, ready to record
3. **Recording**: Currently recording video
4. **Processing**: Saving/downloading recorded video
5. **Error**: Error state with recovery options

### Feature States

1. **Face Tracking**: On/Off
2. **Overlays**: Individual overlay states (glasses: on/off, hat: on/off)
3. **Camera**: Active/Inactive
4. **Recording**: Recording/Not Recording

## Navigation Flow Summary

```
App Load → Camera Permission → Camera Feed →
├── Record Video → Stop Recording → Save File → Ready for Next Recording
├── Enable Face Tracking → Show Outlines → Disable Face Tracking
└── Select Overlays → Apply Overlays → Record with Overlays → Stop → Save
```

This user flow ensures a smooth, intuitive experience from basic video recording through advanced facial tracking and overlay features, with appropriate error handling and state management throughout the journey.
