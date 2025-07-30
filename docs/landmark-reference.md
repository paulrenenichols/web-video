# MediaPipe FaceMesh Landmark Reference Guide

## Overview

MediaPipe FaceMesh provides 468 facial landmark points for precise face tracking. This guide shows you how to look up landmarks and understand their meaning.

## Official Resources

### 1. **MediaPipe Official Documentation**

- **Primary Source**: [MediaPipe FaceMesh Documentation](https://google.github.io/mediapipe/solutions/face_mesh)
- **Landmark Visualization**: [Interactive FaceMesh Demo](https://mediapipe.dev/demo/face_mesh)
- **GitHub Repository**: [MediaPipe FaceMesh](https://github.com/google/mediapipe/tree/master/mediapipe/modules/face_geometry)

### 2. **Interactive Tools**

#### **MediaPipe FaceMesh Demo**

- Visit: https://mediapipe.dev/demo/face_mesh
- Upload a photo or use webcam
- See all 468 landmarks overlaid on the face
- Hover over landmarks to see their index numbers

#### **MediaPipe Studio**

- Visit: https://studio.mediapipe.dev/
- Interactive demos with real-time landmark visualization
- Code examples and API documentation

### 3. **Landmark Index Maps**

#### **Visual Reference Images**

- **468-point map**: [MediaPipe FaceMesh Landmark Map](https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png)
- **Detailed breakdown**: [Landmark Regions](https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png)

#### **Landmark Categories**

```typescript
// Key facial regions and their landmark ranges
const LANDMARK_REGIONS = {
  // Face outline (jawline)
  FACE_OUTLINE: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109,
  ],

  // Left eye
  LEFT_EYE: [
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  ],

  // Right eye
  RIGHT_EYE: [
    362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
    398,
  ],

  // Nose
  NOSE: [
    1, 2, 3, 4, 5, 6, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
  ],

  // Mouth
  MOUTH: [
    0, 267, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375,
    321, 308, 324, 318, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
  ],

  // Eyebrows
  LEFT_EYEBROW: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  RIGHT_EYEBROW: [336, 296, 334, 293, 300, 276, 283, 282, 295, 285],

  // Forehead
  FOREHEAD: [
    151, 337, 9, 10, 108, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136,
    150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454,
    356, 389, 251, 284, 332, 297, 338, 10,
  ],
};
```

## How to Look Up Specific Landmarks

### 1. **Using the Interactive Demo**

1. Go to https://mediapipe.dev/demo/face_mesh
2. Upload a photo or enable webcam
3. Hover over any landmark point
4. The index number will appear in the interface

### 2. **Using Code to Explore Landmarks**

```typescript
// Debug function to explore landmarks
function exploreLandmarks(landmarks: LandmarkPoint[]) {
  // Print all landmarks with their coordinates
  landmarks.forEach((landmark, index) => {
    console.log(`Landmark ${index}:`, {
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility,
    });
  });

  // Find landmarks in specific regions
  const foreheadLandmarks = landmarks.filter((_, index) =>
    [151, 337, 9, 10].includes(index)
  );

  console.log('Forehead landmarks:', foreheadLandmarks);
}
```

### 3. **Common Landmark Indices**

```typescript
// Key landmarks for different features
const KEY_LANDMARKS = {
  // Eyes
  LEFT_EYE_CENTER: 159,
  RIGHT_EYE_CENTER: 386,

  // Nose
  NOSE_TIP: 1,
  NOSE_BRIDGE: 10,

  // Mouth
  MOUTH_CENTER: 0,
  LEFT_MOUTH_CORNER: 61,
  RIGHT_MOUTH_CORNER: 291,

  // Forehead (for hat positioning)
  FOREHEAD_LEFT: 151,
  FOREHEAD_RIGHT: 337,
  FOREHEAD_TOP: 9,
  FOREHEAD_CENTER: 10,

  // Face outline
  LEFT_CHEEK: 123,
  RIGHT_CHEEK: 352,
  CHIN: 152,
};
```

## Understanding Landmark Coordinates

### **Coordinate System**

- **X**: Horizontal position (0 = left edge, 1 = right edge)
- **Y**: Vertical position (0 = top edge, 1 = bottom edge)
- **Z**: Depth (0 = closest to camera, 1 = farthest)
- **Visibility**: Confidence score (0 = not visible, 1 = fully visible)

### **Example Usage**

```typescript
// Get a specific landmark
const leftEye = landmarks[159];
if (leftEye && leftEye.visibility > 0.5) {
  console.log('Left eye position:', {
    x: leftEye.x, // 0-1 normalized
    y: leftEye.y, // 0-1 normalized
    z: leftEye.z, // Depth
    visibility: leftEye.visibility, // Confidence
  });
}
```

## Tools for Development

### 1. **Landmark Visualization Tools**

#### **Create Your Own Debug Tool**

```typescript
// Debug component to visualize specific landmarks
function LandmarkDebugger({ landmarks, indices }: {
  landmarks: LandmarkPoint[],
  indices: number[]
}) {
  return (
    <div>
      {indices.map(index => {
        const landmark = landmarks[index];
        return landmark ? (
          <div key={index}>
            Landmark {index}: ({landmark.x.toFixed(3)}, {landmark.y.toFixed(3)})
          </div>
        ) : null;
      })}
    </div>
  );
}
```

#### **Browser Console Tools**

```javascript
// Add this to your browser console when testing
window.debugLandmarks = function (indices) {
  const landmarks = window.currentLandmarks; // Your landmarks data
  indices.forEach(index => {
    const lm = landmarks[index];
    if (lm) {
      console.log(`Landmark ${index}:`, lm);
    }
  });
};

// Usage: debugLandmarks([151, 337, 9, 10]);
```

### 2. **Online Resources**

#### **MediaPipe Community**

- **GitHub Issues**: Search for landmark-related discussions
- **Stack Overflow**: Tagged with `mediapipe` and `facemesh`
- **Reddit**: r/MediaPipe community

#### **Academic Papers**

- **MediaPipe FaceMesh Paper**: [Real-time Face Mesh](https://arxiv.org/abs/1907.06724)
- **Landmark Detection Papers**: Search for "facial landmark detection"

## Best Practices

### 1. **Landmark Selection**

- Choose landmarks with high visibility scores (> 0.5)
- Use multiple landmarks for redundancy
- Consider landmark stability across frames

### 2. **Performance Optimization**

- Only process landmarks you need
- Cache landmark calculations
- Use visibility scores to filter unreliable landmarks

### 3. **Error Handling**

```typescript
function getLandmark(landmarks: LandmarkPoint[], index: number) {
  const landmark = landmarks[index];
  if (!landmark || landmark.visibility < 0.5) {
    throw new Error(`Landmark ${index} not available or not visible`);
  }
  return landmark;
}
```

## Troubleshooting

### **Common Issues**

1. **Landmarks not detected**: Check visibility scores
2. **Incorrect positioning**: Verify coordinate system understanding
3. **Performance issues**: Limit landmark processing
4. **Mirroring problems**: Handle front-facing camera mirroring

### **Debug Checklist**

- [ ] Verify MediaPipe initialization
- [ ] Check landmark array length (should be 468)
- [ ] Validate coordinate ranges (0-1)
- [ ] Test with different face angles
- [ ] Verify visibility thresholds

This guide should help you effectively look up and understand MediaPipe FaceMesh landmarks for your facial tracking applications!
