// fragment shader for simple terrain application
#version 400 core

// per-frame data
layout(std140)                  // use standard layout
uniform SceneData {             // uniform struct name
    mat4 viewMatrix, viewInverse;
    mat4 projectionMatrix, projectionInverse;
    vec3 lightpos;
    int fog;
};

// shader data
uniform sampler2D colorTexture;
uniform sampler2D normalTexture;
uniform sampler2D glossTexture;

// input from vertex shader
in vec4 position, light;
in vec3 tangent, bitangent, normal;
in vec2 texcoord;

// output to frame buffer
out vec4 fragColor;

void main() {
    // convert points from homogeneous form to true 3D
    // last column of view matrix contains terrain origin in view space
    vec3 pos = position.xyz / position.w;
    vec3 lpos = light.xyz / light.w;
    vec3 terrainOrigin = viewMatrix[3].xyz / viewMatrix[3].w;

    // surface normal, including extra bumps from normal map
    vec3 nmap = texture(normalTexture, texcoord).xyz * 2 - 1;
    vec3 N = normalize(nmap.x * normalize(tangent) +
                       nmap.y * normalize(bitangent) + 
                       nmap.z * normalize(normal));

    // light vectors and dot products
    // for point light, use normalize(lpos - pos)
    vec3 L = normalize(lpos - terrainOrigin);   // direction to light
    vec3 V = normalize(/*eye at 0,0,0*/ - pos); // direction to view
    vec3 H = normalize(V + L);
    float N_L = max(0., dot(N,L)), N_H = max(0., dot(N,H));
    float V_L = dot(V,L), V_H = dot(V,H);
    
    // specular: normalized Blinn-Phong with Kelemen/Szirmay Kalos shadow/mask
    // Schlick approximation to Fresnel for index of refraction 1.5
    float gloss = pow(8192, texture(glossTexture, texcoord).x);
    float spec = (gloss+2) * pow(N_H, gloss) / (1 + max(0.,V_L));
    float fresnel = 0.04 + 0.96 * pow(1 - V_H, 5);

    // combined specular and diffuse
    vec3 color = texture(colorTexture, texcoord).rgb;
    color = mix(color, vec3(spec), fresnel) * N_L;

    // fade to white with fog
    if (fog != 0)
        color = mix(vec3(1,1,1), color, exp2(.005 * pos.z));

    // final color
    fragColor = vec4(color, 1);
}
