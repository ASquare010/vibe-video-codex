"""Validate API graphs with installed ComfyUI on CPU; never enqueue or execute."""
import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import uuid

ROOT = Path('/opt/minimax-h3')
sys.path.insert(0, str(ROOT / 'ComfyUI'))
sys.argv = ['qwen-native-validator', '--cpu']
spec = importlib.util.spec_from_file_location('qwen_api', Path(__file__).with_name('app.py'))
api = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = api
spec.loader.exec_module(api)


async def main():
    from comfy.cli_args import args
    args.cpu = True
    import nodes
    import execution
    await nodes.init_extra_nodes(init_custom_nodes=False)
    results = []
    for precision, count, enhancer, custom in [('int8', 1, False, False), ('bf16', 10, False, True), ('int8', 2, True, False)]:
        r = api.Generation(prompt='Use <image1> as the target.', images=[str(uuid.uuid4())] * count,
                           precision=precision, refine_prompt=enhancer, seed=1,
                           width=1024 if custom else None, height=1024 if custom else None)
        graph = api.graph_for(r, str(uuid.uuid4()), ['portrait_model_denim.png'] * count,
                              api.enhancer_system() if enhancer else '')
        result = await execution.validate_prompt(str(uuid.uuid4()), graph, None)
        results.append({'precision': precision, 'references': count, 'enhancer': enhancer,
                        'customSize': custom, 'valid': result[0], 'error': result[1], 'nodeErrors': result[3]})
    out = {'validation': 'native ComfyUI graph validation on CPU; no enqueue or model inference', 'results': results}
    (ROOT / 'qwen-image-api/state/native-validation.json').write_text(json.dumps(out, indent=2) + '\n')
    print(json.dumps(out, indent=2))
    if not all(r['valid'] for r in results):
        raise SystemExit(1)


asyncio.run(main())
