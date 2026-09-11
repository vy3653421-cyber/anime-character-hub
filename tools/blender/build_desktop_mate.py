import bpy, math, os

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'assets', 'avatar'))
os.makedirs(OUT, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name, color, metallic=0.0, rough=0.5):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Metallic'].default_value = metallic
    bs.inputs['Roughness'].default_value = rough
    return m

skin = mat('Skin', (0.96, 0.68, 0.58), 0, 0.48)
hair = mat('Hair', (0.08, 0.035, 0.12), 0, 0.42)
cloth = mat('Dress', (0.18, 0.28, 0.58), 0, 0.5)
cloth2 = mat('Trim', (0.72, 0.82, 1.0), 0, 0.42)
eye = mat('Iris', (0.12, 0.45, 0.9), 0, 0.22)
dark = mat('Pupil', (0.015, 0.01, 0.02), 0, 0.3)
shoe = mat('Shoes', (0.035, 0.04, 0.07), 0, 0.35)

parts = []
def uv(name, loc, scale, material, seg=32, rings=16):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    parts.append(o)
    return o

def cyl(name, loc, radius, depth, material, scale=(1, 1, 1)):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    parts.append(o)
    return o

def cone(name, loc, r1, r2, depth, material):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r1, radius2=r2, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    parts.append(o)
    return o

# Body and outfit.
cyl('Body', (0, 2.05, 0), 0.68, 1.45, cloth, scale=(1, 1, 0.72))
cone('Skirt', (0, 1.15, 0), 1.0, 0.68, 0.65, cloth)
uv('Collar', (0, 2.72, -0.01), (0.34, 0.16, 0.28), cloth2)

# Face and hair.
head_mesh = uv('Head', (0, 3.55, 0), (0.84, 0.92, 0.78), skin)
uv('HairCap', (0, 3.82, 0.06), (0.91, 0.99, 0.84), hair, 40, 20)
for x in (-0.72, 0.72):
    uv('HairLock', (x, 3.22, 0.05), (0.25, 0.68, 0.30), hair)
uv('HairBack', (0, 3.22, 0.35), (0.76, 0.9, 0.45), hair)

for x in (-0.29, 0.29):
    uv('Eye', (x, 3.58, -0.73), (0.20, 0.27, 0.07), eye, 24, 12)
    uv('Pupil', (x, 3.58, -0.795), (0.085, 0.15, 0.035), dark, 20, 10)
    uv('EyeHighlight', (x - 0.035, 3.66, -0.83), (0.025, 0.045, 0.012), cloth2, 12, 8)
uv('Mouth', (0, 3.25, -0.775), (0.14, 0.045, 0.025), dark, 16, 8)

for x in (-0.88, 0.88):
    a = cyl('Arm', (x, 2.0, 0), 0.17, 1.35, cloth)
    a.rotation_euler[1] = math.radians(-8 * x)
    uv('Hand', (x, 1.30, 0), (0.19, 0.22, 0.18), skin)
for x in (-0.32, 0.32):
    cyl('Leg', (x, 0.35, 0), 0.21, 1.05, skin)
    uv('Shoe', (x, -0.28, -0.18), (0.28, 0.17, 0.43), shoe)
for x in (-0.78, 0.78):
    uv('Ribbon', (x, 2.88, 0.22), (0.16, 0.45, 0.11), cloth2, 16, 10)

# Rig with explicit runtime physics bones.
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm = bpy.context.object
arm.name = 'DesktopMateRig'
arm.data.name = 'DesktopMateRig'
root_bone = arm.data.edit_bones[0]
root_bone.name = 'root'
root_bone.head = (0, 0, 0)
root_bone.tail = (0, 1, 0)
for bone_name, bone_head, bone_tail, parent_name in [
    ('spine', (0, 1.0, 0), (0, 2.5, 0), 'root'),
    ('head', (0, 2.5, 0), (0, 3.7, 0), 'spine'),
    ('hair_left', (-0.72, 3.3, 0.05), (-0.82, 2.7, 0.15), 'head'),
    ('hair_right', (0.72, 3.3, 0.05), (0.82, 2.7, 0.15), 'head'),
    ('ribbon_left', (-0.78, 3.0, 0.2), (-0.78, 2.5, 0.2), 'head'),
    ('ribbon_right', (0.78, 3.0, 0.2), (0.78, 2.5, 0.2), 'head'),
]:
    bone = arm.data.edit_bones.new(bone_name)
    bone.head = bone_head
    bone.tail = bone_tail
    bone.parent = arm.data.edit_bones.get(parent_name)
bpy.ops.object.mode_set(mode='POSE')
for pose_bone in arm.pose.bones:
    pose_bone.rotation_mode = 'XYZ'
bpy.ops.object.mode_set(mode='OBJECT')

for mesh_object in parts:
    if mesh_object.type != 'MESH':
        continue
    modifier = mesh_object.modifiers.new('Armature', 'ARMATURE')
    modifier.object = arm
    group = mesh_object.vertex_groups.new(name='root')
    group.add(list(range(len(mesh_object.data.vertices))), 1.0, 'REPLACE')
    mesh_object.parent = arm

# Facial shape keys expected by the runtime.
head_mesh.shape_key_add(name='Basis')
smile = head_mesh.shape_key_add(name='smile')
blink = head_mesh.shape_key_add(name='blink')
mouth_open = head_mesh.shape_key_add(name='mouthOpen')
for index, vertex in enumerate(head_mesh.data.vertices):
    co = vertex.co
    if co.y < -0.05:
        smile.data[index].co.z -= 0.035 * max(0.0, 1.0 - abs(co.x) / 0.85)
        mouth_open.data[index].co.y -= 0.025
    if abs(co.x) < 0.65 and co.y > 0.1:
        blink.data[index].co.y *= 0.88

# Named motion clips.
def action_rot(name, bone_name, frames, angles):
    action = bpy.data.actions.new(name)
    arm.animation_data_create()
    arm.animation_data.action = action
    pose_bone = arm.pose.bones[bone_name]
    for frame, rotation in zip(frames, angles):
        pose_bone.rotation_euler = rotation
        pose_bone.keyframe_insert('rotation_euler', frame=frame)
    arm.animation_data.action = None
    return action

actions = [
    action_rot('idle', 'spine', [1, 30, 60], [(0,0,0), (0,0.02,0), (0,0,0)]),
    action_rot('breathing', 'spine', [1, 45, 90], [(0,0,0), (0,-0.025,0), (0,0,0)]),
    action_rot('blink', 'head', [1, 4, 8], [(0,0,0), (0,0.02,0), (0,0,0)]),
    action_rot('talking', 'spine', [1, 15, 30], [(0,0,0), (0,0.01,0), (0,0,0)]),
    action_rot('happy', 'spine', [1, 20, 40], [(0,0,0), (0,-0.03,0), (0,0,0)]),
    action_rot('surprised', 'spine', [1, 15, 30], [(0,0,0), (0,0.035,0), (0,0,0)]),
    action_rot('concerned', 'spine', [1, 20, 40], [(0,0,0), (0,0.018,0), (0,0,0)]),
    action_rot('thinking', 'spine', [1, 25, 50], [(0,0,0), (0,-0.015,0), (0,0,0)]),
    action_rot('sleeping', 'head', [1, 30, 60], [(0,0,0), (0,0.08,0), (0,0,0)]),
]

# NLA tracks keep all named clips available to glTF export.
for action in actions:
    track = arm.animation_data_create().nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, 1, action)
    strip.action_frame_start = 1
    strip.action_frame_end = max(60, int(action.frame_range[1]))
    strip.repeat = 1
arm.animation_data.action = None

arm['desktopMateCharacter'] = 'Luna-chan'
arm['productionAsset'] = False
arm['assetNote'] = 'Procedural anime-style starter. Artist refinement and final licensed approval required before production release.'

# Export the complete character hierarchy, not only the armature. The previous
# export selected just the armature, which could leave the generated GLB with a
# skin definition but no mesh nodes actually bound to it in Three.js.
bpy.ops.object.select_all(action='DESELECT')
for mesh_object in parts:
    mesh_object.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'desktop_mate_character.blend'))
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, 'avatar.glb'),
    export_format='GLB',
    use_selection=True,
    export_animations=True,
    export_skins=True,
    export_morph=True,
)
print('Desktop Mate avatar generated:', os.path.join(OUT, 'avatar.glb'))
