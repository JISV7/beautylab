import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useTheme } from '../../contexts/ThemeContext';

interface TangramLoaderProps {
    onFinish: () => void;
}

type TangramPieceData = {
    id: string;
    color: string;
    stateA: [number, number][];
    stateB: [number, number][];
    rotX: number;
    rotY: number;
    rotZ: number;
};

const resolveCSSColor = (cssVar: string): THREE.Color => {
    const prop = cssVar.replace(/var\(\s*|\s*\)/g, '').trim();
    const val = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
    return new THREE.Color(val || '#00a86b');
};

export const TangramLoader: React.FC<TangramLoaderProps> = ({ onFinish }) => {
    const { currentMode } = useTheme();
    const [isExiting, setIsExiting] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const frameRef = useRef<number | null>(null);

    const handleFinish = () => {
        setIsExiting(true);
        timelineRef.current?.kill();
        setTimeout(onFinish, 500);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
        camera.position.set(0, 0, 18);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(4, 8, 12);
        scene.add(ambientLight, directionalLight);

        // Build the tangram and get the sequence of targets
        const { meshes, sequenceTargets } = buildTangram(scene);

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        const tl = buildTimeline(meshes, sequenceTargets, handleFinish);
        timelineRef.current = tl;

        const handleResize = () => {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            tl.kill();
            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current.domElement.remove();
                rendererRef.current = null;
            }
        };
    }, []);

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center palette-background transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'} ${currentMode}`}>
            <div ref={containerRef} className="w-full h-full" />
            <button className="skip-button" onClick={handleFinish}>
                Saltar Animación →
            </button>
            <style>{`
                .skip-button {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--palette-surface);
                    border: 1px solid var(--palette-border);
                    color: var(--text-p-color);
                    border-radius: 9999px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .skip-button:hover {
                    transform: translateY(-2px);
                    background: var(--palette-primary);
                    color: white;
                    border-color: var(--palette-primary);
                }
            `}</style>
        </div>
    );
};

function getCentroid(points: [number, number][]) {
    const sum = points.reduce(
        (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
        { x: 0, y: 0 }
    );
    return { x: sum.x / points.length, y: sum.y / points.length };
}

type TargetPos = { x: number; y: number; rotX: number; rotY: number; rotZ: number };

function buildTangram(scene: THREE.Scene) {
    const tangramGroup = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    const depth = 0.4;

    // Use variant 1 to define the base meshes (Square stateA is same for all)
    const basePieces = getTangramConfig(1).piecesData;
    
    // 1. Create the meshes in their base Square positions
    basePieces.forEach((data) => {
        const centroidA = getCentroid(data.stateA);
        const shape = new THREE.Shape();

        data.stateA.forEach(([x, y], index) => {
            const localX = x - centroidA.x;
            const localY = y - centroidA.y;
            if (index === 0) shape.moveTo(localX, localY);
            else shape.lineTo(localX, localY);
        });
        shape.closePath();

        const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
        geometry.translate(0, 0, -depth / 2);

        const material = new THREE.MeshBasicMaterial({
            color: resolveCSSColor(data.color),
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = data.id;
        mesh.position.set(centroidA.x, centroidA.y, 0);
        
        tangramGroup.add(mesh);
        meshes.push(mesh);
    });

    // 2. Calculate the center of the Square for global group positioning
    const startBox = new THREE.Box3().setFromObject(tangramGroup);
    const startCenter = new THREE.Vector3();
    startBox.getCenter(startCenter);
    tangramGroup.position.set(-startCenter.x, -startCenter.y, 0);

    // 3. Pre-calculate the target positions for all 3 variants (Ibex, Bat, Factory)
    const sequenceTargets: TargetPos[][] = [];

    [1, 2, 3].forEach(num => {
        const variantData = getTangramConfig(num).piecesData;
        const variantTargets: TargetPos[] = [];
        const variantGroup = new THREE.Group();

        // Temporary meshes to calculate the bounding box of the target shape
        variantData.forEach((data, i) => {
            const centroidB = getCentroid(data.stateB);
            const meshClone = meshes[i].clone();
            meshClone.position.set(centroidB.x, centroidB.y, 0);
            meshClone.rotation.set(data.rotX, data.rotY, data.rotZ);
            variantGroup.add(meshClone);
        });

        const endBox = new THREE.Box3().setFromObject(variantGroup);
        const endCenter = new THREE.Vector3();
        endBox.getCenter(endCenter);

        // Calculate offset to keep the target shape centered relative to the origin
        const centerOffset = new THREE.Vector3().subVectors(startCenter, endCenter);

        variantData.forEach((data) => {
            const centroidB = getCentroid(data.stateB);
            variantTargets.push({
                x: centroidB.x + centerOffset.x,
                y: centroidB.y + centerOffset.y,
                rotX: data.rotX,
                rotY: data.rotY,
                rotZ: data.rotZ
            });
        });

        sequenceTargets.push(variantTargets);
    });

    scene.add(tangramGroup);
    return { meshes, sequenceTargets };
}

function buildTimeline(
    meshes: THREE.Mesh[],
    sequenceTargets: TargetPos[][],
    onComplete: () => void
) {
    const timeline = gsap.timeline({ onComplete: onComplete });
    
    // Store original Square positions for returning to base
    const basePositions = meshes.map(m => ({ x: m.position.x, y: m.position.y, z: 0, rotX: 0, rotY: 0, rotZ: 0 }));

    sequenceTargets.forEach((targetSet, shapeIndex) => {
        const duration = 2.5;
        const startTime = timeline.duration();

        // --- Step A: Animate from Square to Target Shape ---
        targetSet.forEach((target, i) => {
            const mesh = meshes[i];
            const peakZ = 1 + i * 0.3;

            // Move X, Y
            timeline.to(mesh.position, {
                x: target.x,
                y: target.y,
                duration,
                ease: 'power3.inOut'
            }, startTime);

            // Move Z (peak)
            timeline.to(mesh.position, {
                z: peakZ,
                duration: duration / 2,
                ease: 'power1.out'
            }, startTime);

            timeline.to(mesh.position, {
                z: 0,
                duration: duration / 2,
                ease: 'power1.in'
            }, startTime + duration / 2);

            // Rotate
            timeline.to(mesh.rotation, {
                x: target.rotX,
                y: target.rotY,
                z: target.rotZ,
                duration,
                ease: 'power3.inOut'
            }, startTime);
        });

        // Pause at the shape for a moment
        timeline.to({}, { duration: 1.5 });

        // --- Step B: Animate from Target Shape back to Square ---
        const backStartTime = timeline.duration();
        basePositions.forEach((base, i) => {
            const mesh = meshes[i];
            const peakZ = 1 + (meshes.length - i) * 0.3;

            timeline.to(mesh.position, {
                x: base.x,
                y: base.y,
                duration: duration * 0.8,
                ease: 'power2.inOut'
            }, backStartTime);

            timeline.to(mesh.position, {
                z: peakZ,
                duration: (duration * 0.8) / 2,
                ease: 'power1.out'
            }, backStartTime);

            timeline.to(mesh.position, {
                z: 0,
                duration: (duration * 0.8) / 2,
                ease: 'power1.in'
            }, backStartTime + (duration * 0.8) / 2);

            timeline.to(mesh.rotation, {
                x: base.rotX,
                y: base.rotY,
                z: base.rotZ,
                duration: duration * 0.8,
                ease: 'power2.inOut'
            }, backStartTime);
        });

        // Brief pause at square before next shape
        if (shapeIndex < sequenceTargets.length - 1) {
            timeline.to({}, { duration: 0.5 });
        }
    });

    return timeline;
}

function getTangramConfig(selectedTangram: number) {
    const variants: Record<number, { piecesData: TangramPieceData[] }> = {
        1: {
            piecesData: [
                {
                    id: 'p-l1_green',
                    color: 'var(--palette-primary)',
                    stateA: [
                        [0, 4],
                        [0, 0],
                        [2, 2],
                    ],
                    stateB: [
                        [-1, 1],
                        [-1, -3],
                        [-3, -1],
                    ],
                    rotX: Math.PI * 2,
                    rotY: Math.PI,
                    rotZ: 0,
                },
                {
                    id: 'p-l2_blue',
                    color: 'var(--palette-accent)',
                    stateA: [
                        [0, 0],
                        [4, 0],
                        [2, 2],
                    ],
                    stateB: [
                        [-1, 3],
                        [-1, -1],
                        [1, 1],
                    ],
                    rotX: 0,
                    rotY: Math.PI * 2,
                    rotZ: -Math.PI / 2,
                },
                {
                    id: 'p-s1_red',
                    color: 'var(--palette-primary)',
                    stateA: [
                        [0, 4],
                        [1, 3],
                        [2, 4],
                    ],
                    stateB: [
                        [2, 2],
                        [0, 2],
                        [1, 3],
                    ],
                    rotX: Math.PI * 2,
                    rotY: 0,
                    rotZ: Math.PI,
                },
                {
                    id: 'p-sq_yellow',
                    color: 'var(--palette-secondary)',
                    stateA: [
                        [2, 4],
                        [1, 3],
                        [2, 2],
                        [3, 3],
                    ],
                    stateB: [
                        [0, 4],
                        [-1, 3],
                        [0, 2],
                        [1, 3],
                    ],
                    rotX: 0,
                    rotY: Math.PI * 2,
                    rotZ: 0,
                },
                {
                    id: 'p-m_purple',
                    color: 'var(--palette-border)',
                    stateA: [
                        [4, 4],
                        [2, 4],
                        [4, 2],
                    ],
                    stateB: [
                        [-0.13, 0.93],
                        [1.87, -1.07],
                        [-0.13, -1.07],
                    ],
                    rotX: Math.PI * 2,
                    rotY: Math.PI,
                    rotZ: -Math.PI / 4,
                },
                {
                    id: 'p-s2_cyan',
                    color: 'var(--palette-secondary)',
                    stateA: [
                        [3, 3],
                        [2, 2],
                        [3, 1],
                    ],
                    stateB: [
                        [-3.1, -0.1],
                        [-3.1, -2.1],
                        [-4.1, -1.1],
                    ],
                    rotX: 0,
                    rotY: Math.PI * 2,
                    rotZ: Math.PI / 4,
                },
                {
                    id: 'p-p_orange',
                    color: 'var(--palette-surface)',
                    stateA: [
                        [3, 3],
                        [3, 1],
                        [4, 0],
                        [4, 2],
                    ],
                    stateB: [
                        [-3, 3],
                        [-1, 3],
                        [0, 4],
                        [-2, 4],
                    ],
                    rotX: Math.PI * 2,
                    rotY: 0,
                    rotZ: Math.PI / 2,
                },
            ],
        },
        2: {
            piecesData: [
                {
                    id: 'p-l1_green',
                    color: 'var(--palette-primary)',
                    stateA: [
                        [0, 4],
                        [0, 0],
                        [2, 2],
                    ],
                    stateB: [
                        [2.22, 2.75],
                        [2.22, -0.75],
                        [4.22, 0.75],
                    ],
                    rotX: Math.PI,
                    rotY: 0,
                    rotZ: Math.PI / 4,
                },
                {
                    id: 'p-l2_blue',
                    color: 'var(--palette-primary)',
                    stateA: [
                        [0, 0],
                        [4, 0],
                        [2, 2],
                    ],
                    stateB: [
                        [-3.55, 0.25],
                        [-1.55, 0.25],
                        [-3.55, 2.25],
                    ],
                    rotX: 0,
                    rotY: 0,
                    rotZ: (3 * Math.PI) / 4,
                },
                {
                    id: 'p-s1_red',
                    color: 'var(--palette-border)',
                    stateA: [
                        [0, 4],
                        [1, 3],
                        [2, 4],
                    ],
                    stateB: [
                        [1.01, 0.01],
                        [2.01, -0.99],
                        [3.01, 0.01],
                    ],
                    rotX: Math.PI,
                    rotY: 0,
                    rotZ: Math.PI,
                },
                {
                    id: 'p-sq_yellow',
                    color: 'var(--palette-accent)',
                    stateA: [
                        [2, 4],
                        [1, 3],
                        [2, 2],
                        [3, 3],
                    ],
                    stateB: [
                        [0, 1],
                        [-1, 0],
                        [0, -1],
                        [1, 0],
                    ],
                    rotX: 0,
                    rotY: Math.PI * 2,
                    rotZ: 0,
                },
                {
                    id: 'p-m_purple',
                    color: 'var(--palette-secondary)',
                    stateA: [
                        [4, 4],
                        [2, 4],
                        [4, 2],
                    ],
                    stateB: [
                        [0.65, -0.83],
                        [-1.35, -0.83],
                        [0.65, -2.83],
                    ],
                    rotX: 0,
                    rotY: 0,
                    rotZ: (5 * Math.PI) / 4,
                },
                {
                    id: 'p-s2_cyan',
                    color: 'var(--palette-surface)',
                    stateA: [
                        [3, 3],
                        [2, 2],
                        [3, 1],
                    ],
                    stateB: [
                        [1.35, 0.2],
                        [0.35, -0.6],
                        [1.35, -1.6],
                    ],
                    rotX: Math.PI,
                    rotY: 0,
                    rotZ: Math.PI / 2,
                },
                {
                    id: 'p-p_orange',
                    color: 'var(--palette-border)',
                    stateA: [
                        [3, 3],
                        [3, 1],
                        [4, 0],
                        [4, 2],
                    ],
                    stateB: [
                        [-3, -1],
                        [-1, -1],
                        [0, 0],
                        [-2, 0],
                    ],
                    rotX: Math.PI * 3,
                    rotY: 0,
                    rotZ: Math.PI / 2,
                },
            ],
        },
        3: {
            piecesData: [
                {
                    id: 'p-l1_green',
                    color: 'var(--palette-border)',
                    stateA: [[0, 4], [0, 0], [2, 2]],
                    stateB: [[0.65, 0.8], [0.65, -3.2], [2.65, -1.2]],
                    rotX: Math.PI * 2, rotY: Math.PI, rotZ: 0
                },
                {
                    id: 'p-l2_blue',
                    color: 'var(--palette-surface)',
                    stateA: [[0, 0], [4, 0], [2, 2]],
                    stateB: [[-2, -3.2], [2, -3.2], [0, -1.2]],
                    rotX: Math.PI * 2, rotY: Math.PI * 2, rotZ: Math.PI * 2
                },
                {
                    id: 'p-s1_red',
                    color: 'var(--palette-accent)',
                    stateA: [[0, 4], [1, 3], [2, 4]],
                    stateB: [[-2, -0.54], [-1, -1.54], [0, -0.54]],
                    rotX: Math.PI * 2, rotY: 0, rotZ: Math.PI
                },
                {
                    id: 'p-sq_yellow',
                    color: 'var(--palette-primary)',
                    stateA: [[2, 4], [1, 3], [2, 2], [3, 3]],
                    stateB: [[0, 0.8], [-1, -0.2], [0, -1.2], [1, -0.2]],
                    rotX: Math.PI * 2, rotY: Math.PI * 2, rotZ: 0
                },
                {
                    id: 'p-m_purple',
                    color: 'var(--palette-border)',
                    stateA: [[4, 4], [2, 4], [4, 2]],
                    stateB: [[-2, -1.2], [0, -1.2], [-2, -3.2]],
                    rotX: Math.PI * 2, rotY: Math.PI, rotZ: 0
                },
                {
                    id: 'p-s2_cyan',
                    color: 'var(--palette-primary)',
                    stateA: [[3, 3], [2, 2], [3, 1]],
                    stateB: [[1.65, 3.78], [0.65, 2.78], [1.65, 1.78]],
                    rotX: Math.PI * 2, rotY: Math.PI, rotZ: 0
                },
                {
                    id: 'p-p_orange',
                    color: 'var(--palette-secondary)',
                    stateA: [[3, 3], [3, 1], [4, 0], [4, 2]],
                    stateB: [[0.98, 2.78], [0.98, 0.78], [1.98, -0.22], [1.98, 1.78]],
                    rotX: Math.PI * 2, rotY: Math.PI, rotZ: 0
                }
            ],
        },
    };

    return variants[selectedTangram] ?? variants[1];
}
