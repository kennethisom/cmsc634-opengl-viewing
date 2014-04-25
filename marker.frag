// fragment shader for light marker in terrain demo: solid grey
#version 400 core

// output to frame buffer
out vec4 fragColor;

void main() {
    fragColor = vec4(.5, .5, .5, 1);
}
