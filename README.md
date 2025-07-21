# Sim4Sim - Simulation Environment Builder

A lightweight web application for setting up 3D simulation environments. Build, arrange, and export simulation scenes with an intuitive drag-and-drop interface.

![Sim4Sim Interface](https://via.placeholder.com/800x400/667eea/ffffff?text=Sim4Sim+3D+Environment+Builder)

## Features

- **3D Environment**: Interactive 3D scene with ground plane and realistic lighting
- **File Support**: Drag and drop support for:
  - `.stl` files (3D models)
  - `.xml` files (simulation configurations)
  - `.urdf` files (robot descriptions)
- **Interactive Controls**: Move, rotate, and position objects in 3D space
- **Visual Feedback**: Real-time object manipulation with transform controls
- **Scene Export**: Generate and download XML files describing the complete scene
- **Modern UI**: Beautiful, responsive interface with gradient styling

## Getting Started

### Prerequisites

- A modern web browser with WebGL support
- Python 3.x (for local development server)

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Start a local server:

```bash
# Using Python (recommended)
python3 -m http.server 8000

# Or using Node.js (if you have it installed)
npx serve .

# Or using PHP
php -S localhost:8000
```

4. Open your browser and navigate to `http://localhost:8000`

## Usage

### Adding Objects to Your Scene

1. **Drag and Drop**: Simply drag files from your computer directly onto the 3D scene
2. **File Upload**: Click the "Click to upload or drag files here" button in the sidebar
3. **Supported Formats**:
   - **STL files**: Will appear as 3D meshes with random colors
   - **XML files**: Will appear as cyan boxes representing configuration data
   - **URDF files**: Will appear as red boxes representing robot descriptions

### Manipulating Objects

1. **Select Objects**: Click on any object in the 3D scene or in the sidebar list
2. **Transform Controls**: Use the visual gizmo that appears to:
   - Move objects by dragging the colored arrows
   - Rotate objects by dragging the colored rings
   - Scale objects by dragging the colored squares
3. **Precise Control**: Use the numeric inputs in the sidebar for exact positioning

### Exporting Your Scene

1. Arrange all objects as desired
2. Click the "Export Scene XML" button
3. Download the generated XML file containing:
   - Object positions and rotations
   - File references and types
   - Scene metadata and timestamps

## Technical Details

### Architecture

- **Frontend**: Pure HTML, CSS, and JavaScript
- **3D Engine**: Three.js for WebGL rendering
- **File Handling**: Browser File API for drag-and-drop
- **No Backend Required**: Completely client-side application

### Browser Compatibility

- Chrome/Chromium 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### File Format Support

#### STL Files
- Binary and ASCII STL formats supported
- Automatic centering and scaling
- Random material assignment for visual distinction

#### XML/URDF Files
- Parsed and validated for XML structure
- Visual representation as colored boxes
- Original XML content preserved for export

### Scene Export Format

The exported XML follows this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<simulation_scene>
  <metadata>
    <created>2024-01-01T00:00:00.000Z</created>
    <generator>Sim4Sim Environment Builder</generator>
    <object_count>3</object_count>
  </metadata>
  <objects>
    <object id="0">
      <name>robot.urdf</name>
      <type>urdf</type>
      <transform>
        <position>
          <x>0.000000</x>
          <y>1.000000</y>
          <z>0.000000</z>
        </position>
        <rotation>
          <x>0.000000</x>
          <y>0.000000</y>
          <z>0.000000</z>
        </rotation>
        <scale>
          <x>1.000000</x>
          <y>1.000000</y>
          <z>1.000000</z>
        </scale>
      </transform>
    </object>
  </objects>
</simulation_scene>
```

## Controls

### Mouse Controls
- **Left Click**: Select objects
- **Left Click + Drag**: Orbit camera (when no object selected)
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out

### Transform Modes
The transform controls support three modes (automatically activated):
- **Translate**: Move objects along X, Y, Z axes
- **Rotate**: Rotate objects around X, Y, Z axes
- **Scale**: Resize objects uniformly or per-axis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in multiple browsers
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the browser console for error messages
- Ensure WebGL is enabled in your browser

## Roadmap

- [ ] Support for more file formats (OBJ, GLTF, DAE)
- [ ] Advanced material editing
- [ ] Scene templates and presets
- [ ] Collaborative editing features
- [ ] Animation timeline support
- [ ] Physics simulation preview