
// When Bruno's PC showed elastic scroll, and mine didn't 
// I wonder how am I going to find out which device does what...

import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from 'gsap'

/**
 * Debug
 */
const gui = new GUI()

const parameters = {
    materialColor: '#5d52ff'
}

gui
    .addColor(parameters, 'materialColor')
    .onChange(() => {
        material.color.set(parameters.materialColor)
    })


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Objects
 */

// Textures
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load('textures/gradients/3.jpg')
gradientTexture.magFilter = THREE.NearestFilter
const particleTexture = textureLoader.load('textures/points/magic_02.png')

// Material
const material = new THREE.MeshToonMaterial({
    color: parameters.materialColor,
    gradientMap: gradientTexture
})

// Meshes
const objectsDistance = 4
const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeGeometry(1, 2, 32),
    material
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
)

mesh1.position.y = - objectsDistance * 0
mesh2.position.y = - objectsDistance * 1
mesh3.position.y = - objectsDistance * 2

mesh1.position.x = 2
mesh2.position.x = -2
mesh3.position.x = 2

scene.add(mesh1, mesh2, mesh3)

const sectionMeshes = [mesh1, mesh2, mesh3]


/**
 * Particles
 */
const numberOfParticles = 1000
const totalNumberOfArrayElements = numberOfParticles * 3
const positionsArray = new Float32Array(totalNumberOfArrayElements)

for (let i = 0; i < positionsArray.length; i++) {
    const i3 = i * 3
    positionsArray[i3 + 0] = (Math.random() - 0.5) * 10
    positionsArray[i3 + 1] = (Math.random() - 0.5) * 10 * objectsDistance * sectionMeshes.length
    positionsArray[i3 + 2] = (Math.random() - 0.5) * 10
}

const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3)
const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', positionsAttribute)


const pointsMaterial = new THREE.PointsMaterial({
    size: 0.5,
    sizeAttenuation: true,
    color: 'red',
    alphaMap: particleTexture,
    transparent: true,
    depthWrite: false,
    // blending: THREE.AdditiveBlending
})

const particles = new THREE.Points(particlesGeometry, pointsMaterial)

scene.add(particles)



/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('white', 3)
directionalLight.position.set(1, 1, 0)
scene.add(directionalLight)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const cameraGroup = new THREE.Group()

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)
scene.add(cameraGroup)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */
let scrollY = window.scrollY
let currentSection = 0

window.addEventListener('scroll', () => {
    scrollY = window.scrollY

    const newSection = Math.round(scrollY / sizes.height)

    if (newSection != currentSection) {
        currentSection = newSection

        gsap.to(
            sectionMeshes[currentSection].rotation,
            {
                duration: 1.5,
                ease: 'power2.inOut',
                x: '+=6',
                y: '+=3',
                z: '+=1.5'
            }
        )

        console.log('changed', currentSection)
    }

})

/**
 * Cursor
 */
const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove', (event) => {
    // We divide by sizes.width and height, because the default values would have been smaller for smaller pixel
    // And way too large for larger screens. So, dividing, we get range from 0-1
    // You can make half screen and log values without dividing and see, then make your screen large and see the values go way up.
    // Now divide and see, the range is from 0-1

    // -0.5 Makes it go from -0.5 to 0.5 so that we can move all sides
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5
})


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Animate camera
    // The camera is going down 1 unit for each section scrolled, but since the objects are seperated by 4 units,
    // We simply multiply it by the objectsDistance variable.

    // A simple example would be, imagine the window height to be 10, and if each scroll of one unit.
    // If you scroll 10 units, then it becomes (-10/10) = -1 units. 
    // Therefore camera moves down by 1 units but the next object is 4 units down.
    // Hence, multiply by the objectsDistance, to get correct scroll length.
    camera.position.y = (-scrollY / sizes.height) * objectsDistance
    // console.log(camera.position.y)

    const parallaxX = cursor.x * 0.5
    const parallaxY = - cursor.y * 0.5

    // We use cameraGroup here so that the not-scrolling issue is fixed.
    // The reason it wasn't scrolling because, both the 'y' position of camera here and above are correct.
    // SO, JS doesn't know which one to follow, and follows the last written line of code, which is the parallax.
    // But simply adding the camera to a group solves it very intuitively.

    // make it 1/10th, watch video from 50:00
    // later changed to 5, see video
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime

    // Animate the meshes
    for (const mesh of sectionMeshes) {
        mesh.rotation.x += deltaTime * 0.1
        mesh.rotation.y += deltaTime * 0.1
    }


    // Animate particles
    if (particles) {
        particles.rotation.z += 0.00005
        // particles.rotation.y += 0.0005
    }


    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()