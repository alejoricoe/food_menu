import trimesh
from trimesh.transformations import translation_matrix, rotation_matrix
import numpy as np
from pathlib import Path

OUT = Path(__file__).parent / 'assets' / 'models'
OUT.mkdir(parents=True, exist_ok=True)

def colorize(mesh, rgba):
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, face_colors=np.array(rgba, dtype=np.uint8))
    return mesh

def add(scene, geom, name, xyz=(0,0,0)):
    geom.apply_translation(xyz)
    scene.add_geometry(geom, node_name=name)


def plate(scene, radius=0.145, z=0.008):
    p = colorize(trimesh.creation.cylinder(radius=radius, height=0.012, sections=64), [235, 235, 230, 255])
    add(scene, p, 'plate', (0,0,z))
    rim = colorize(trimesh.creation.torus(major_radius=radius*0.84, minor_radius=0.007, major_sections=64, minor_sections=16), [205,205,200,255])
    add(scene, rim, 'plate_rim', (0,0,z+0.008))


def burger():
    s = trimesh.Scene(); plate(s, 0.15, 0.007)
    # flattened cylinders; total food height ~8 cm
    layers = [
        ('bottom_bun', 0.060, 0.018, 0.027, [221,156,70,255]),
        ('lettuce',    0.064, 0.008, 0.040, [68,145,70,255]),
        ('patty',      0.059, 0.018, 0.053, [92,50,37,255]),
        ('cheese',     0.063, 0.006, 0.066, [242,187,55,255]),
        ('tomato',     0.058, 0.007, 0.074, [205,59,50,255]),
    ]
    for name, r, h, z, c in layers:
        add(s, colorize(trimesh.creation.cylinder(radius=r, height=h, sections=48), c), name, (0,0,z))
    bun = colorize(trimesh.creation.uv_sphere(radius=0.063, count=[48,24]), [226,163,76,255])
    bun.apply_scale([1,1,0.48]); add(s, bun, 'top_bun', (0,0,0.094))
    # sesame seeds
    for i, (x,y) in enumerate([(0.0,0.0),(0.025,0.015),(-0.023,0.013),(0.018,-0.021),(-0.020,-0.018)]):
        seed=colorize(trimesh.creation.uv_sphere(radius=0.004, count=[16,8]), [245,225,175,255]); seed.apply_scale([1.0,0.5,0.35]); add(s, seed, f'seed{i}', (x,y,0.124))
    return s


def pasta():
    s = trimesh.Scene(); plate(s, 0.155, 0.007)
    bowl = colorize(trimesh.creation.cylinder(radius=0.105, height=0.032, sections=64), [244,242,236,255]); add(s, bowl, 'bowl', (0,0,0.027))
    sauce = colorize(trimesh.creation.cylinder(radius=0.092, height=0.008, sections=64), [222,177,77,255]); add(s, sauce, 'pasta_base', (0,0,0.047))
    # noodle loops with torus primitives
    rng=np.random.default_rng(2)
    for i in range(16):
        r=float(rng.uniform(0.025,0.052));
        tor=colorize(trimesh.creation.torus(major_radius=r, minor_radius=0.0032, major_sections=40, minor_sections=10), [241,198,83,255])
        tor.apply_transform(rotation_matrix(float(rng.uniform(-0.25,0.25)), [1,0,0]))
        add(s, tor, f'noodle{i}', (float(rng.uniform(-0.028,0.028)), float(rng.uniform(-0.028,0.028)), 0.055+float(rng.uniform(0,0.02))))
    # garnish
    for i,(x,y) in enumerate([(0.02,0.01),(-0.025,0.025),(0.0,-0.03)]):
        leaf=colorize(trimesh.creation.icosphere(subdivisions=2, radius=0.008), [61,129,64,255]); leaf.apply_scale([1.5,0.5,0.3]); add(s, leaf, f'basil{i}', (x,y,0.082))
    return s


def salmon():
    s = trimesh.Scene(); plate(s, 0.16, 0.007)
    fish=colorize(trimesh.creation.box(extents=[0.12,0.065,0.032]), [226,119,84,255]);
    fish.apply_transform(rotation_matrix(np.deg2rad(10), [0,0,1])); add(s, fish, 'salmon', (-0.015,0,0.042))
    # grill lines
    for i,x in enumerate(np.linspace(-0.04,0.04,4)):
        line=colorize(trimesh.creation.box(extents=[0.007,0.072,0.002]), [110,64,48,255]); line.apply_transform(rotation_matrix(np.deg2rad(10), [0,0,1])); add(s,line,f'grill{i}',(x-0.015,0,0.059))
    # asparagus
    for i,y in enumerate([-0.075,-0.058,-0.041]):
        asp=colorize(trimesh.creation.cylinder(radius=0.006, height=0.115, sections=20), [75,133,68,255]); asp.apply_transform(rotation_matrix(np.pi/2,[0,1,0])); add(s,asp,f'asp{i}',(0.025,y,0.031))
    lemon=colorize(trimesh.creation.cylinder(radius=0.025,height=0.007,sections=32),[245,216,77,255]); lemon.apply_transform(rotation_matrix(np.pi/2,[1,0,0])); add(s,lemon,'lemon',(0.09,0.06,0.035))
    return s

for name, fn in [('classic_burger', burger), ('truffle_pasta', pasta), ('grilled_salmon', salmon)]:
    scene=fn()
    path=OUT/f'{name}.glb'
    path.write_bytes(scene.export(file_type='glb'))
    print('wrote', path, path.stat().st_size)
