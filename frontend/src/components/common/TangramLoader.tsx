import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useTheme } from '../../contexts/ThemeContext';

interface TangramLoaderProps {
    onFinish: () => void;
    selectedTangram?: number;
}

type TangramPieceData = {
    id: string;
    color: number;
    stateA: [number, number][];
    stateB: [number, number][];
    rotX: number;
    rotY: number;
    rotZ: number;
};

export const TangramLoader: React.FC<TangramLoaderProps> = ({ onFinish, selectedTangram = 1 }) => {
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(4, 8, 12);
        scene.add(ambientLight, directionalLight);

        const { piecesData } = getTangramConfig(selectedTangram);
        const meshes = buildTangram(scene, piecesData);

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        const tl = buildTimeline(meshes);
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
    }, [selectedTangram]);

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

function buildTangram(scene: THREE.Scene, piecesData: TangramPieceData[]) {
    const tangramGroup = new THREE.Group();
    const meshes: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial>[] = [];
    const depth = 0.4;

    piecesData.forEach((data) => {
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

        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.3,
            metalness: 0.1,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = data.id;
        mesh.position.set(centroidA.x, centroidA.y, 0);
        const centroidB = getCentroid(data.stateB);
        mesh.userData = {
            stateB: {
                x: centroidB.x,
                y: centroidB.y,
                rotX: data.rotX,
                rotY: data.rotY,
                rotZ: data.rotZ,
            },
        };

        tangramGroup.add(mesh);
        meshes.push(mesh);
    });

    scene.add(tangramGroup);
    return meshes;
}

function buildTimeline(meshes: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial>[]) {
    const timeline = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 1.5 });

    meshes.forEach((mesh, index) => {
        const target = mesh.userData.stateB as { x: number; y: number; rotX: number; rotY: number; rotZ: number };
        const duration = 3;
        const peakZHeight = 1 + index * 0.4;

        timeline.to(
            mesh.position,
            {
                x: target.x,
                y: target.y,
                duration,
                ease: 'power3.inOut',
            },
            0
        );

        timeline.to(
            mesh.position,
            {
                z: peakZHeight,
                duration: duration / 2,
                ease: 'power1.out',
            },
            0
        );

        timeline.to(
            mesh.position,
            {
                z: 0,
                duration: duration / 2,
                ease: 'power1.in',
            },
            duration / 2
        );

        timeline.to(
            mesh.rotation,
            {
                x: target.rotX,
                y: target.rotY,
                z: target.rotZ,
                duration,
                ease: 'power3.inOut',
            },
            0
        );
    });

    return timeline;
}

function getTangramConfig(selectedTangram: number) {
    const variants: Record<number, { piecesData: TangramPieceData[] }> = {
        1: {
            piecesData: [
                {
                    id: 'p-l1_green',
                    color: 0x00cc7c,
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
                    color: 0x2583ef,
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
                    color: 0xec4654,
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
                    color: 0xfad405,
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
                    color: 0xad43df,
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
                    color: 0x0fc8e6,
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
                    color: 0xfd8b01,
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
                    color: 0x00cc7c,
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
                    color: 0x2583ef,
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
                    color: 0xec4654,
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
                    color: 0xfad405,
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
                    color: 0xad43df,
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
                    color: 0x0fc8e6,
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
                    color: 0xfd8b01,
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
                    color: 0x00cc7c,
                    stateA: [
                        [0, 0],
                        [0, -4],
                        [2, -2],
                    ],
                    stateB: [
                        [2.67, -2],
                        [2.67, -6],
                        [4.67, -4],
                    ],
                    rotX: 0,
                    rotY: 0,
                    rotZ: Math.PI,
                },
                {
                    id: 'p-l2_blue',
                    color: 0x2583ef,
                    stateA: [
                        [0, -4],
                        [4, -4],
                        [2, -2],
                    ],
                    stateB: [
                        [0, -4],
                        [4, -4],
                        [2, -2],
                    ],
                    rotX: 0,
                    rotY: 0,
                    rotZ: 0,
                },
                {
                    id: 'p-s1_red',
                    color: 0xec4654,
                    stateA: [
                        [0, 0],
                        [2, 0],
                        [1, -1],
                    ],
                    stateB: [
                        [0, 1.33],
                        [2, 1.33],
                        [1, 0.33],
                    ],
                    rotX: 0,
                    rotY: 0,
                    rotZ: Math.PI,
                },
                {
                    id: 'p-sq_yellow',
                    color: 0xfad405,
                    stateA: [
                        [2, 0],
                        [3, -1],
                        [2, -2],
                        [1, -1],
                    ],
                    stateB: [
                        [2, 0],
                        [3, -1],
                        [2, -2],
                        [1, -1],
                    ],
                    rotX: 0,
                    rotY: 0,
                    rotZ: 0,
                },
                {
                    id: 'p-m_purple',
                    color: 0xad43df,
                    stateA: [
                        [2, 0],
                        [4, 0],
                        [4, -2],
                    ],
                    stateB: [
                        [-0.02, 2],
                        [-2.02, 2],
                        [-0.02, 0],
                    ],
                    rotX: 0,
                    rotY: 0,
                    rotZ: -Math.PI / 2,
                },
                {
                    id: 'p-s2_cyan',
                    color: 0x0fc8e6,
                    stateA: [
                        [2, -2],
                        [3, -1],
                        [3, -3],
                    ],
                    stateB: [
                        [0.67, 2],
                        [-0.33, 1.4],
                        [0.67, 0.4],
                    ],
                    rotX: Math.PI,
                    rotY: 0,
                    rotZ: Math.PI / 2,
                },
                {
                    id: 'p-p_orange',
                    color: 0xfd8b01,
                    stateA: [
                        [3, -1],
                        [4, 0],
                        [4, -2],
                        [3, -3],
                    ],
                    stateB: [
                        [3, 2],
                        [4, 2],
                        [4, -1],
                        [3, -1],
                    ],
                    rotX: Math.PI,
                    rotY: 0,
                    rotZ: 0,
                },
            ],
        },
    };

    return variants[selectedTangram] ?? variants[1];
}
