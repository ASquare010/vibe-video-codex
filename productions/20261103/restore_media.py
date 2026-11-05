"""Restore hash-verified render inputs into an isolated local directory. Never submits jobs."""
import argparse
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--film', help='One manifest film key; omit to restore all six exports')
    parser.add_argument('--output', type=Path, default=ROOT / 'local-media')
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    films = [f for f in manifest['films'] if not args.film or f['key'] == args.film]
    if not films:
        parser.error('Unknown film key')
    checked = set()
    with zipfile.ZipFile(args.archive) as archive:
        for film in films:
            records = json.loads((ROOT / film['key'] / 'media.json').read_text(encoding='utf-8'))
            for record in records:
                member = record['archiveMember']
                if member not in checked:
                    digest = hashlib.sha256()
                    with archive.open(member) as source:
                        for chunk in iter(lambda: source.read(1024 * 1024), b''):
                            digest.update(chunk)
                    if digest.hexdigest() != record['sha256']:
                        raise ValueError('Archive hash mismatch: ' + member)
                    checked.add(member)
                if args.verify_only:
                    continue
                base = (args.output / film['key'] / film['projectId']).resolve()
                destination = (base / record['path']).resolve()
                if not destination.is_relative_to(base) or destination == base:
                    raise ValueError('Unsafe media path')
                if destination.exists():
                    if hashlib.sha256(destination.read_bytes()).hexdigest() != record['sha256']:
                        raise FileExistsError('Refusing to overwrite different media: ' + str(destination))
                    continue
                destination.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(member) as source, destination.open('xb') as target:
                    shutil.copyfileobj(source, target)
            print(film['key'] + ': verified' + ('' if args.verify_only else ' and restored'))


if __name__ == '__main__':
    main()
