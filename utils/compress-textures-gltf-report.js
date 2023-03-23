import { prune, dedup, resample, textureResize } from '@gltf-transform/functions';

/**Script to rename and compress the textures with different names https://gltf.report/ */

/**
 * simple_pipeline.js
 *
 * Short example of an glTF optimization pipeline implemented with
 * the glTF-Transform (https://gltf-transform.donmccurdy.com/) API.
 * Other common problems — e.g. high vertex or draw counts — may
 * require working in other tools, like gltfpack or Blender.
 */


let texts = document.getRoot().listTextures();
for(let i = 0; i< texts.length; i++){
	let mat = texts[i].listParents()[1]
	texts[i].setName(mat.getName())
}

const regex = new RegExp('Ball_UEFA_2023')
await document.transform(
	// Remove duplicate vertex or texture data, if any.
	dedup(),

	// Losslessly resample animation frames.
	resample(),

	// Remove unused nodes, textures, or other data.
	prune(),

	// Resize all textures to ≤1K.
	textureResize({size: [1024, 1024]}),
	textureResize({pattern: /[A-Za-z]+_uefa/i ,size: [256, 256]}),
	textureResize({pattern: /[A-Za-z]+_Eyes1/i ,size: [128, 128]}),
	textureResize({pattern: /[A-Za-z]+_Head1/i ,size: [256, 256]}),
);
