// import loadFont from 'load-bmfont'
import { PMREMGenerator } from 'three'
import RESOURCES from './ResourcesManager'
import { DRACOLoader } from './DracoLoader'
import Detect from '../Detect' //Import on package.json
import Emitter from '../Emitter' //Import on package.json
import { ONASSETLOADED, ONASSETSLOADED } from '../constants'
import { TextureLoader,
  RGBAFormat,
  RGBA_BPTC_Format,
  RGBA_ASTC_4x4_Format,
  RGB_S3TC_DXT1_Format,
  RGBA_S3TC_DXT5_Format,
  RGB_PVRTC_4BPPV1_Format,
  RGBA_PVRTC_4BPPV1_Format,
  RGB_ETC1_Format,
  RGB_ETC2_Format,
  RGBA_ETC2_EAC_Format,
  Texture,
  RGBA_S3TC_DXT3_Format,
  CompressedTexture,
  CompressedTextureLoader,
  LinearFilter
 } from 'three'
 import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
 import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
 import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
 import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

//  import { BasisManager } from './BasisManager'
// import { BasisTextureLoader } from 'three/examples/jsm/loaders/BasisTextureLoader'
// import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

export default class AssetLoader {

  constructor({
    gltf = true,
    ktx2 = true,
    draco = true,
    exr = true,
    pmremgenerator = false,
    renderer
  } = {}) {

    this.textureLoader = new TextureLoader()
    this.renderer = renderer

    if (gltf) {
      this.GLTFLoader = new GLTFLoader()
      this.GLTFLoader.setMeshoptDecoder(MeshoptDecoder)
    }

    if (draco) {
      this.dracoLoader = new DRACOLoader()
      console.log(this.dracoLoader)
      this.dracoLoader.setDecoderPath(`/draco/`)
      console.log(this.dracoLoader)
      this.GLTFLoader.setDRACOLoader(this.dracoLoader)
    }

    // if (ktx2) {
    //   this.basisManager = new BasisManager(`static/basis/BasisWorker.js`)

    //   this.ktx2Loader = new KTX2Loader()
    //   this.ktx2Loader.setTranscoderPath(`static/basis/`)
    //   this.ktx2Loader.detectSupport(this.renderer)

    //   this.basisTextureLoader = new BasisTextureLoader()
    //   this.basisTextureLoader.setTranscoderPath(`static/basis/`)
    //   this.basisTextureLoader.detectSupport(this.renderer)

    //   if (gltf) this.GLTFLoader.setKTX2Loader(this.ktx2Loader)
    // }

    if (exr) this.EXRLoader = new EXRLoader()

    if (pmremgenerator) this.PMREMGenerator = new PMREMGenerator(this.renderer)

    this.assetsToLoad = 0
    this.assetsLoaded = 0
    this.loaded = false
    this.waitForJSON = false

    this.JSONS = []
    this.images = []
    this.sounds = []
    this.videos = []
    this.textures = []
    this.models = []
    this.fontTextures = []

    if (this.waitForJSON) {
      if (typeof RESOURCES.jsons !== 'undefined' && RESOURCES.jsons.length > 0) {
        this.assetsToLoad += RESOURCES.jsons.length
        this.loadJSONS(() => {
          const projects = this.JSONS[0].media.projects

          for (let i = 0; i < projects.length; i++) {
            const project = projects[i];

            if (project.type === 'image') {
              const object = {
                id: project.id,
                url: `images/projects/${project.id}/${project.id}.png`
              }

              RESOURCES.textures.push(object)
            } else {
              const object = {
                id: project.id,
                url: `videos/projects/${project.id}/${project.id}.mp4`
              }

              RESOURCES.videos.push(object)
            }

          }

          this._startLoading()
        })
      }
    } else {
      this._startLoading()
    }
  }

  async _startLoading() {

    Emitter.on(ONASSETSLOADED, () => {
      this.loaded = true
    })

    // ----------

    if (typeof RESOURCES.images !== 'undefined' && RESOURCES.images.length > 0) {
      this.assetsToLoad += RESOURCES.images.length
    }

    if (typeof RESOURCES.textures !== 'undefined' && RESOURCES.textures.length > 0) {
      this.assetsToLoad += RESOURCES.textures.length
    }

    if (typeof RESOURCES.sounds !== 'undefined' && RESOURCES.sounds.length > 0) {
      this.assetsToLoad += RESOURCES.sounds.length
    }

    if (typeof RESOURCES.videos !== 'undefined' && RESOURCES.videos.length > 0) {
      this.assetsToLoad += RESOURCES.videos.length
    }

    if (typeof RESOURCES.models !== 'undefined' && RESOURCES.models.length > 0) {
      this.assetsToLoad += RESOURCES.models.length
    }

    if (typeof RESOURCES.fontTextures !== 'undefined' && RESOURCES.fontTextures.length > 0) {
      this.assetsToLoad += RESOURCES.fontTextures.length
    }

    // ----------

    if (typeof RESOURCES.images !== 'undefined' && RESOURCES.images.length > 0) {
      await this.loadImages()
    }

    if (typeof RESOURCES.textures !== 'undefined' && RESOURCES.textures.length > 0) {
      await this.loadTextures()
    }

    if (typeof RESOURCES.sounds !== 'undefined' && RESOURCES.sounds.length > 0) {
      await this.loadSounds()
    }

    if (typeof RESOURCES.videos !== 'undefined' && RESOURCES.videos.length > 0) {
      await this.loadVideos()
    }

    if (typeof RESOURCES.models !== 'undefined' && RESOURCES.models.length > 0) {
      await this.loadModels()
    }

    // if (typeof RESOURCES.fontTextures !== 'undefined' && RESOURCES.fontTextures.length > 0) {
    //   await this.loadFontTextures()
    // }

    // ----------

    if (this.assetsToLoad === 0) Emitter.emit(ONASSETSLOADED, 100)
  }

  // Getters

  getImage(id) {
    return this.images.find(image => image.id === id)
  }
  getTexture(id) {
    return this.textures.find(texture => texture.id === id)
  }
  getSound(id) {
    return this.sounds.find(sound => sound.id === id)
  }
  getVideo(id) {
    return this.videos.find(video => video.id === id)
  }
  getModel(id) {
    return this.models.find(model => model.id === id)
  }
  getFontTexture(id) {
    return this.fontTextures.find(fontTexture => fontTexture.id === id)
  }
  getJSON(id) {
    return this.JSONS.find(json => json.id === id)
  }

  async loadImages() {
    const images = RESOURCES.images

    for (let i = 0; i < images.length; i += 1) {

      await this.loadImage(images[i]).then((image) => {

        this.images.push(image)
        this.assetsLoaded += 1

        const percent = (this.assetsLoaded / this.assetsToLoad) * 100
        Emitter.emit(ONASSETLOADED, percent)
        if (percent === 100) setTimeout(() => { Emitter.emit(ONASSETSLOADED, percent) })
      }, (err) => {
        console.log(err)
      })

    }
  }

  async loadImage(media) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.alt = media.description

      image.onload = () => {
        resolve({ id: media.id, media: image })
      }

      image.onerror = () => {
        reject(`Erreur lors du chargement de l'image : ${image.src}`)
      }

      image.src = `${media.url}`
    })
  }

  async loadTextures(textures = RESOURCES.textures) {
    for (let i = 0; i < textures.length; i += 1) {
      await this.loadTexture(textures[i]).then((texture) => {
        this.textures.push(texture)
        this.assetsLoaded += 1

        const percent = (this.assetsLoaded / this.assetsToLoad) * 100
        // console.log(this.assetsToLoad)
        Emitter.emit(ONASSETLOADED, percent)
        if (percent === 100) setTimeout(() => { Emitter.emit(ONASSETSLOADED, percent) }, 100)
      }, (err) => {
        console.log(err)
      })

    }
  }

  async loadTexture(media) {
    const ext = `${media.url}`.split('.').pop();
    // if (ext === 'ktx2') {
    //   return new Promise((resolve, reject) => {
    //     fetch(`${media.url}`).then((test) => {
    //       test.arrayBuffer().then((buffer) => {
    //         this.basisManager.parseTexture(buffer).then((text) => {
    //           const texture = new CompressedTexture([text[0]], text[0].width, text[0].height)
    //           texture.minFilter = LinearFilter
    //           texture.magFilter = LinearFilter
    //           texture.format = text.internalFormat
    //           texture.generateMipmaps = false
    //           texture.needsUpdate = true

    //           if (typeof media.init !== 'undefined' && media.init) this.renderer.initTexture(texture)

    //           resolve({ id: media.id, media: texture })
    //         })
    //       })
    //     })
    //   })

    // } else if (ext === 'basis') {
    //   return new Promise((resolve, reject) => {
    //     this.basisTextureLoader.load(
    //       `${media.url}`,
    //       (texture) => {
    //         // setTimeout(() => {
    //           if (typeof media.init !== 'undefined' && media.init) this.renderer.initTexture(texture)
    //           resolve({ id: media.id, media: texture })
    //         // }, 100)
    //       },
    //       (xhr) => {
    //         // console.log(`${((xhr.loaded / xhr.total) * 100)} % loaded`)
    //       },
    //       (xhr) => {
    //         reject(`Une erreur est survenue lors du chargement de la texture : ${xhr}`)
    //       },
    //     )
    //   })
    // } else
    if (ext === 'exr') {
      return new Promise((resolve, reject) => {
        this.EXRLoader.load(
          `${media.url}`,
          (texture, textureData) => {
            if (typeof media.init !== 'undefined' && media.init) this.renderer.initTexture(texture)
            resolve({ id: media.id, media: texture, textureData })
          },
          (xhr) => {
            // console.log(`${((xhr.loaded / xhr.total) * 100)} % loaded`)
          },
          (xhr) => {
            reject(`Une erreur est survenue lors du chargement de la texture : ${xhr}`)
          },
        )
      })
    } else {
      return new Promise((resolve, reject) => {
        this.textureLoader.load(
          `${media.url}`,
          (texture) => {
            if (typeof media.init !== 'undefined' && media.init) this.renderer.initTexture(texture)
            resolve({ id: media.id, media: texture })
          },
          (xhr) => {
            console.log(`${((xhr.loaded / xhr.total) * 100)} % loaded`)
          },
          (xhr) => {
            reject(`Une erreur est survenue lors du chargement de la texture : ${xhr}`)
          },
        )
      })
    }
  }

  // async loadSounds() {
  //   const sounds = RESOURCES.sounds

  //   for (let i = 0; i < sounds.length; i++) {
  //     await this.loadSound(sounds[i]).then((sound) => {
  //       this.sounds.push(sound)
  //       this.assetsLoaded += 1

  //       const percent = (this.assetsLoaded / this.assetsToLoad) * 100
  //       Emitter.emit(ONASSETLOADED, percent)
  //       if (percent === 100) setTimeout(() => { Emitter.emit(ONASSETSLOADED, percent) })
  //     }, (err) => {
  //       console.log(err)
  //     })
  //   }
  // }

  // async loadSound(media) {
  //   return new Promise((resolve, reject) => {
  //     const sound = AudioController.createSound({
  //       id: media.id,
  //       url: `${media.url}`,
  //       useAnalyser: media.analyser,
  //     })

  //     sound.on('ready', () => {
  //       resolve({ id: media.id, media: sound })
  //     })

  //     sound.on('error', () => {
  //       reject(`Une erreur est survenue lors du chargement du son : ${sound}`)
  //     })
  //   })
  // }

  async loadVideos() {
    const videos = RESOURCES.videos

    for (let i = 0; i < videos.length; i += 1) {

      await this.loadVideo(videos[i]).then((video) => {
        this.videos.push(video)
        this.assetsLoaded += 1
        const percent = (this.assetsLoaded / this.assetsToLoad) * 100
        Emitter.emit(ONASSETLOADED, percent)
        if (percent === 100) setTimeout(() => { Emitter.emit(ONASSETSLOADED, percent) })
      }, (err) => {
        console.log(err)
      })

    }
  }

  async loadVideo(media) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')

      video.oncanplaythrough = () => {
        resolve({ id: media.id, media: video })
      }

      video.oncanplay = () => {
        resolve({ id: media.id, media: video })
      }

      video.onloadedmetadata = () => {
        resolve({ id: media.id, media: video })
      }

      video.onloadeddata = () => {
        resolve({ id: media.id, media: video })
      }

      const interval = setInterval(() => {
        if (video.readyState === 4) {
          clearInterval(interval)
          resolve({ id: media.id, media: video })
        }
      }, 100)

      video.onerror = () => {
        reject(`Une erreur est survenue lors du chargement de la video : ${video}`)
      }

      video.src = `${media.url}`

    })
  }

  async loadModels() {

    const models = RESOURCES.models

    for (let i = 0; i < models.length; i += 1) {

      await this.loadModel(models[i]).then((model) => {

        this.models.push(model)
        this.assetsLoaded += 1

        const percent = (this.assetsLoaded / this.assetsToLoad) * 100

        Emitter.emit(ONASSETLOADED, percent)
        if (percent === 100) setTimeout(() => { Emitter.emit(ONASSETSLOADED, percent) })
      }, (err) => {
        console.error(err)
      })

    }
  }

  async loadModel(model) {

    return new Promise((resolve, reject) => {

      const ext = model.url.split('.').pop();


      switch (ext) {

        case 'obj': {
          const loader = new OBJLoader();

          // load a resource
          loader.load(
            // resource URL
            `${model.url}`,
            // Function when resource is loaded
            (object) => {

              resolve({ id: model.id, media: object, type: 'obj' });
            },

            () => { },
            () => {
              reject('An error happened with the model import.');
            },
          );
          break;
        }

        case 'gltf': {
          // load a resource
          this.GLTFLoader.load(
            // resource URL
            `${model.url}`,
            // Function when resource is loaded
            (object) => {
              resolve({ id: model.id, media: object, type: 'gltf' });
            },

            () => { },
            (err) => {
              console.log(err)
              reject('An error happened with the model import.');
            },
          );
          break;
        }

        case 'glb': {
          // load a resource
          this.GLTFLoader.load(
            // resource URL
            `${model.url}`,
            // Function when resource is loaded
            (object) => {
              if (model.init) {
                object.scene.traverse((child) => {
                  if (child.material) {
                    if (child.material.map) this.renderer.initTexture(child.material.map)
                    if (child.material.roughnessMap) this.renderer.initTexture(child.material.roughnessMap)
                    if (child.material.normalMap) this.renderer.initTexture(child.material.normalMap)
                    if (child.material.metalnessMap) this.renderer.initTexture(child.material.metalnessMap)
                    if (child.material.envMap) this.renderer.initTexture(child.material.envMap)
                    if (child.material.aoMap) this.renderer.initTexture(child.material.aoMap)
                    if (child.material.alphaMap) this.renderer.initTexture(child.material.alphaMap)
                    if (child.material.lightMap) this.renderer.initTexture(child.material.lightMap)
                  }
                })
              }
              resolve({ id: model.id, media: object, type: 'gltf' });
            },

            () => { },
            (err) => {
              console.log(err)
              reject('An error happened with the model import.');
            },
          );
          break;
        }

        case 'fbx': {
          const loader = new FBXLoader();
          // const dracoLoader = new DRACOLoader()
          // dracoLoader.setDecoderPath('draco/')
          // loader.setDRACOLoader(dracoLoader)

          // load a resource
          loader.load(
            // resource URL
            `${model.url}`,
            // Function when resource is loaded
            (object) => {
              resolve({ id: model.id, media: object, type: 'fbx' });
            },

            () => { },
            () => {
              reject('An error happened with the model import.');
            },
          );
          break;
        }

        default: {
          const loader = new OBJLoader();

          // load a resource
          loader.load(
            // resource URL
            `${model.url}`,
            // Function when resource is loaded
            (object) => {
              resolve({ id: model.id, media: object, type: 'obj' });
            },

            () => { },
            () => {
              reject('An error happened with the model import.');
            },
          );
        }
      }

    });
  }

  // async loadFontTextures() {
  //   const fontTextures = RESOURCES.fontTextures

  //   for (let i = 0; i < fontTextures.length; i += 1) {

  //     await this.loadFontTexture(fontTextures[i]).then((fontTexture) => {
  //       this.fontTextures.push(fontTexture)
  //       this.assetsLoaded += 1
  //       const percent = (this.assetsLoaded / this.assetsToLoad) * 100
  //       Emitter.emit(ONASSETLOADED, percent)
  //       if (percent === 100) setTimeout(() => { Emitter.emit(ONASSETSLOADED, percent) })
  //     }, (err) => {
  //       console.error(err)
  //     })

  //   }
  // }

  // async loadFontTexture(fontsTexture) {
  //   return new Promise((resolve, reject) => {
  //     loadFont(`${fontsTexture.json}`, (err, font) => {
  //       if (err) {
  //         reject('error while loading font texture {1} : ' + err)
  //       }
  //       this.textureLoader.load(`${fontsTexture.image}`, (texture) => {
  //         resolve({ id: fontsTexture.id, media: { font, texture } })
  //       }, undefined, (err) => {
  //         reject('error while loading font texture {2} : ' + err)
  //       })
  //     })
  //   })
  // }

  loadJSONS(callback) {
    const jsons = RESOURCES.jsons

    for (let i = 0; i < jsons.length; i += 1) {

      this.loadJSON(jsons[i]).then((json) => {

        this.JSONS.push(json)

        this.jsons.push(json)
        this.assetsLoaded += 1

        if (this.waitForJSON) {
          callback()
        } else {
          const percent = (this.assetsLoaded / this.assetsToLoad) * 100
          Emitter.emit(ONASSETLOADED, percent)

          if (percent === 100) {
            setTimeout(() => { Emitter.emit(ONASSETSLOADED, percent) })
          }
        }
      }, (err) => {
        console.error(err)
      })

    }
  }

  loadJSON(media) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.overrideMimeType("application/json")
      request.open('GET', media.url, true)
      request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == "200") {
          resolve({ id: media.id, media: JSON.parse(request.responseText) })
        }
      }
      request.send(null)
    })
  }
}