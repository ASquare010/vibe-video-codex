"""Coarse world/camera guides; no inference, ballistics or collision simulation.

Input JSON: objects[{id,center,size,yawDegrees?,color?}],
paths[{id,points,aimOrigin? or aimDirection?,targetTolerance?}], cameras[{id,position,lookAt,
horizontalFovDegrees?,width?,height?,requiredPoints?:[{name,point}]}].
An attached camera may replace position
with attachPath/progress/offsetWorld, and lookAt with lookAtPath/lookProgress.
Coordinates are right-handed, Z-up; box local length is Y. Units are consistent
scene units, normally meters. Perspective is computed, not inferred from prose.
SVG is always written; PNG is also written if Pillow is already available.
"""
import argparse
import html
import itertools
import json
import math
import re
from pathlib import Path


def add(a, b): return tuple(x + y for x, y in zip(a, b))
def sub(a, b): return tuple(x - y for x, y in zip(a, b))
def mul(a, s): return tuple(x * s for x in a)
def dot(a, b): return sum(x * y for x, y in zip(a, b))
def norm(a): return math.sqrt(dot(a, a))
def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def vec(v):
    if len(v) != 3 or not all(isinstance(x, (int, float)) and math.isfinite(x) for x in v):
        raise ValueError('Expected three finite coordinates')
    return tuple(v)


def unit(v):
    n = norm(v)
    if n < 1e-9: raise ValueError('Zero direction or coincident camera/target')
    return mul(v, 1/n)


def at(points, t):
    if not 0 <= t <= 1: raise ValueError('Path progress must be in [0,1]')
    lengths = [norm(sub(b, a)) for a, b in zip(points, points[1:])]
    total = sum(lengths)
    if total < 1e-9: raise ValueError('Path has no length')
    distance = t * total
    for a, b, length in zip(points, points[1:], lengths):
        if length > 0 and distance <= length:
            return add(a, mul(sub(b, a), distance/length))
        distance -= length
    return points[-1]


def camera(spec, paths):
    position = (add(at(paths[spec['attachPath']], spec.get('progress', 0)), vec(spec['offsetWorld']))
                if 'attachPath' in spec else vec(spec['position']))
    target = (at(paths[spec['lookAtPath']], spec.get('lookProgress', spec.get('progress', 0)))
              if 'lookAtPath' in spec else vec(spec['lookAt']))
    forward = unit(sub(target, position))
    right = unit(cross(forward, vec(spec.get('up', [0, 0, 1]))))
    up = cross(right, forward)
    w, h = spec.get('width', 540), spec.get('height', 960)
    fov = spec.get('horizontalFovDegrees', 45)
    if not (16 <= w <= 4096 and 16 <= h <= 4096 and 1 < fov < 175):
        raise ValueError('Invalid canvas/FOV')
    focal = w / (2 * math.tan(math.radians(fov) / 2))

    def project(p):
        q = sub(p, position)
        z = dot(q, forward)
        if z <= .03: return None
        return (w/2 + focal*dot(q, right)/z, h/2 - focal*dot(q, up)/z, z)
    return project, (w, h), position, target


def box(obj):
    center, size = vec(obj['center']), vec(obj['size'])
    if min(size) <= 0: raise ValueError('Object sizes must be positive')
    angle = math.radians(obj.get('yawDegrees', 0))
    c, s = math.cos(angle), math.sin(angle)
    vertices = []
    for x, y, z in itertools.product((-.5, .5), repeat=3):
        x, y, z = x*size[0], y*size[1], z*size[2]
        vertices.append(add(center, (c*x-s*y, s*x+c*y, z)))
    return vertices


def save_drawing(base, size, commands):
    w, h = size
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
             f'<rect width="{w}" height="{h}" fill="#101923"/>']
    try:
        from PIL import Image, ImageDraw
        img = Image.new('RGB', size, '#101923')
        draw = ImageDraw.Draw(img)
    except ImportError:
        img = draw = None
    for kind, pts, color, label in commands:
        points = ' '.join(f'{x:.2f},{y:.2f}' for x, y in pts)
        if kind == 'polygon':
            parts.append(f'<polygon points="{points}" fill="{color}" stroke="#b7c9d6" stroke-width="1"/>')
            if draw: draw.polygon(pts, fill=color, outline='#b7c9d6')
        elif kind == 'line':
            parts.append(f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="3"/>')
            if draw: draw.line(pts, fill=color, width=3)
        else:
            x, y = pts[0]
            parts.append(f'<text x="{x:.2f}" y="{y:.2f}" fill="{color}" font-family="sans-serif" font-size="13">{html.escape(label)}</text>')
            if draw: draw.text((x, y-12), label, fill=color)
    parts.append('</svg>')
    base.with_suffix('.svg').write_text('\n'.join(parts), encoding='utf-8')
    if img: img.save(base.with_suffix('.png'))


def build(scene, out):
    paths = {}
    checks = []
    ids = [o['id'] for o in scene['objects']]
    if len(ids) != len(set(ids)): raise ValueError('Duplicate object IDs')
    for p in scene.get('paths', []):
        points = [vec(v) for v in p['points']]
        if len(points) < 2 or p['id'] in paths: raise ValueError('Invalid/duplicate path')
        at(points, .5)
        paths[p['id']] = points
        if 'aimOrigin' in p or 'aimDirection' in p:
            direction = unit(sub(points[0], vec(p['aimOrigin'])) if 'aimOrigin' in p else vec(p['aimDirection']))
            delta = sub(points[-1], points[0])
            forward = dot(delta, direction)
            lateral = norm(sub(delta, mul(direction, forward)))
            tolerance = p.get('targetTolerance', .2)
            if tolerance < 0: raise ValueError('Negative target tolerance')
            ok = forward > 0 and lateral <= tolerance
            checks.append({'pathId': p['id'], 'forwardDistance': forward,
                           'targetOffsetFromAimRay': lateral, 'tolerance': tolerance, 'pass': ok,
                           'aimBasis': 'mechanism-origin-to-source' if 'aimOrigin' in p else 'declared direction'})
    out.mkdir(parents=True, exist_ok=True)
    if any(out.iterdir()): raise ValueError('Output directory must be empty; preserve earlier guides')
    cams = []
    faces = [(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]
    for spec in scene['cameras']:
        name = spec['id']
        if not re.fullmatch(r'[A-Za-z0-9_-]+', name) or name in [c['id'] for c in cams]:
            raise ValueError('Camera IDs must be unique safe filenames')
        project, size, pos, target = camera(spec, paths)
        projected = []
        labels = []
        for obj in scene['objects']:
            vertices = [project(v) for v in box(obj)]
            for face in faces:
                points = [vertices[i] for i in face]
                if any(v is None for v in points): continue
                projected.append((sum(v[2] for v in points)/4, 'polygon',
                                  [(v[0],v[1]) for v in points], obj.get('color','#37546b'), ''))
            q = project(vec(obj['center']))
            if q and 0 <= q[0] <= size[0] and 0 <= q[1] <= size[1]:
                labels.append(('text', [(q[0],q[1])], '#ffffff', obj['id']))
        commands = [(kind, pts, color, label) for _,kind,pts,color,label in sorted(projected, key=lambda v:-v[0])]
        for name_, points in paths.items():
            source_spec = next(p for p in scene['paths'] if p['id'] == name_)
            if 'aimOrigin' in source_spec:
                pa, pb = project(vec(source_spec['aimOrigin'])), project(points[0])
                if pa and pb: commands.append(('line', [(pa[0],pa[1]),(pb[0],pb[1])], '#7bd4f0', ''))
            for a, b in zip(points, points[1:]):
                pa, pb = project(a), project(b)
                if pa and pb: commands.append(('line', [(pa[0],pa[1]),(pb[0],pb[1])], '#ffb34d', ''))
            q = project(points[-1])
            if q: labels.append(('text', [(q[0]+5,q[1]-7)], '#ffcf86', name_+' target'))
        commands += labels
        cx, cy = size[0]/2, size[1]/2
        commands += [('line', [(cx-7,cy),(cx+7,cy)], '#ffffff', ''),
                     ('line', [(cx,cy-7),(cx,cy+7)], '#ffffff', '')]
        commands += [('text', [(14,24)], '#ffffff', 'BLOCKOUT / '+spec['id']),
                     ('text', [(14,size[1]-18)], '#b7c9d6', 'Geometry guide only - not generated footage')]
        save_drawing(out/spec['id'], size, commands)
        aim = project(target)
        visibility = []
        for requirement in spec.get('requiredPoints', []):
            q = project(vec(requirement['point']))
            ok = q is not None and 0 <= q[0] <= size[0] and 0 <= q[1] <= size[1]
            check = {'cameraId': spec['id'], 'pointName': requirement['name'],
                     'screenPixel': list(q[:2]) if q else None, 'pass': ok}
            visibility.append(check)
            checks.append(check)
        cams.append({'id': spec['id'], 'computedPosition': pos, 'computedLookAt': target,
                     'lookAtScreenPixel': list(aim[:2]) if aim else None, 'canvas': size,
                     'requiredPointVisibility': visibility})
    report = {'status': 'pass' if all(c['pass'] for c in checks) else 'failed-geometry-check',
              'checks': checks, 'cameras': cams,
              'limits': ['Projected coarse boxes and path rays only; no ballistics or collision/occlusion solver.',
                         'No source images edited, no model calls, no proof that generated assets obey this layout.']}
    (out/'validation.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scene', required=True, type=Path)
    parser.add_argument('--out-dir', required=True, type=Path)
    args = parser.parse_args()
    result = build(json.loads(args.scene.read_text(encoding='utf-8')), args.out_dir)
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['status'] == 'pass' else 2)
