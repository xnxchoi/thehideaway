const Sound = class {
    constructor(e) {
      ((this.consts = {
        music: {
          a20221012: "./asset/audio/20221012.mp3",
          a20220912: "./asset/audio/20220912.mp3",
          a20220720: "./asset/audio/20220720.mp3",
          a20220525: "./asset/audio/20220525.mp3",
          a20220420: "./asset/audio/20220420.mp3",
          a20220309: "./asset/audio/20220309.mp3",
          a20220216: "./asset/audio/20220216.mp3",
          a20220119: "./asset/audio/20220119.mp3",
          a20220000: "./asset/audio/00000000.mp3",
          a20211203: "./asset/audio/20211203.mp3",
          a20211022: "./asset/audio/20211022.mp3",
          a20210929: "./asset/audio/00000000.mp3",
          a20210928: "./asset/audio/20210928.mp3",
          a20210723: "./asset/audio/20210723.mp3",
          a20210317: "./asset/audio/20210317.mp3",
          a20210127: "./asset/audio/00000000.mp3",
          a20210000: "./asset/audio/00000000.mp3",
          a20201218: "./asset/audio/20201218.mp3",
          a20200930: "./asset/audio/00000000.mp3",
          a20200722: "./asset/audio/20200722.mp3",
          a20200630: "./asset/audio/20200630.mp3",
          a20200527: "./asset/audio/20200527.mp3",
          a20200325: "./asset/audio/20200325.mp3",
          a20200212: "./asset/audio/20200212.mp3",
          a20200000: "./asset/audio/00000000.mp3",
          a20191122: "./asset/audio/20191122.mp3",
          a20190920: "./asset/audio/20190920.mp3",
          a20190626: "./asset/audio/20190626.mp3",
          a20190529: "./asset/audio/20190529.mp3",
          a20190410: "./asset/audio/20190410.mp3",
          a20190313: "./asset/audio/20190313.mp3",
          a20190306: "./asset/audio/00000000.mp3",
          a20190227: "./asset/audio/20190227.mp3",
          a20190126: "./asset/audio/20190126.mp3",
          a20190109: "./asset/audio/20190109.mp3",
          a20190000: "./asset/audio/00000000.mp3",
          a20181116: "./asset/audio/20181116.mp3",
          a20180831: "./asset/audio/00000000.mp3",
          a20180801: "./asset/audio/20180801.mp3",
          a20180718: "./asset/audio/20180718.mp3",
          a20180701: "./asset/audio/20180701.mp3",
          a20180516: "./asset/audio/20180516.mp3",
          a20180000: "./asset/audio/00000000.mp3",
          a20171101: "./asset/audio/20171101.mp3",
          a20170927: "./asset/audio/20170927.mp3"
        },
        frequency: {
          allpass: 11025,
          lowpass: 1e3,
          rate: 0.01
        }
      }),
        (this.props = {
          muted: !1
        }),
        (this.objs = {
          music: {}
        }));
    }
    play(e) {
      let t = "a" + e.label;
      (t in this.objs.music ||
        ((this.objs.music[t] = {
          audio: new Audio(this.consts.music[t])
        }),
        (this.objs.music[t].audio.muted = this.props.muted),
        (this.objs.music[t].audio.loop = !0),
        (this.objs.music[t].audio.preload = "auto"),
        (this.objs.music[t].audioContext = new (window.AudioContext ||
          window.webkitAudioContext ||
          !1)()),
        (this.objs.music[t].mediaElementSource = this.objs.music[
          t
        ].audioContext.createMediaElementSource(this.objs.music[t].audio)),
        (this.objs.music[t].gain =
          this.objs.music[t].audioContext.createGain()),
        (this.objs.music[t].gain.gain.value = 0),
        this.objs.music[t].mediaElementSource.connect(this.objs.music[t].gain),
        (this.objs.music[t].filter =
          this.objs.music[t].audioContext.createBiquadFilter()),
        (this.objs.music[t].filter.type = "lowpass"),
        (this.objs.music[t].filter.frequency.value =
          this.consts.frequency.allpass),
        this.objs.music[t].gain.connect(this.objs.music[t].filter),
        this.objs.music[t].filter.connect(
          this.objs.music[t].audioContext.destination
        )),
        gsap.to(this.objs.music[t].gain.gain, {
          value: 1,
          duration: 1,
          ease: Power0.easeNone,
          onStart: () => {
            this.objs.music[t].audio.play();
          }
        }));
    }
    pause() {
      for (let e in this.objs.music)
        this.objs.music[e].gain.gain.value > 0 &&
          gsap.to(this.objs.music[e].gain.gain, {
            value: 0,
            duration: 0.5,
            ease: Power0.easeNone,
            onComplete: () => {
              this.objs.music[e].audio.pause();
            }
          });
    }
    muted(e) {
      for (let t in this.objs.music) this.objs.music[t].audio.muted = e.value;
      this.props.muted = e.value;
    }
    lowpass() {
      for (let e in this.objs.music)
        this.objs.music[e].gain.gain.value > 0 &&
          gsap.to(this.objs.music[e].filter.frequency, {
            value: this.consts.frequency.lowpass,
            duration: 0.5,
            ease: Power0.easeNone
          });
    }
    allpass() {
      for (let e in this.objs.music)
        this.objs.music[e].gain.gain.value > 0 &&
          gsap.to(this.objs.music[e].filter.frequency, {
            value: this.consts.frequency.allpass,
            duration: 0.5,
            ease: Power0.easeNone
          });
    }
  },
  Renderer = class {
    constructor(e) {
      ((this.args = {
        render: new THREE.Object3D(),
        ...e
      }),
        (this.objs = {
          object3D: new THREE.Object3D()
        }),
        (this.props = {}),
        (this.consts = {}),
        this.args.render.add(this.objs.object3D));
    }
    addFrame() {
      ((this.request = window.requestAnimationFrame(this.addFrame.bind(this))),
        this.frame());
    }
    addResize() {
      ((this.objs.resize = () => {
        this.resize();
      }),
        window.addEventListener("resize", this.objs.resize, !1),
        this.resize());
    }
    addWheel() {
      ((this.objs.wheel = (e) => {
        this.wheel({
          delta: e.deltaY ? -e.deltaY : e.wheelDelta ? e.wheelDelta : -e.detail
        });
      }),
        document.addEventListener("wheel", this.objs.wheel));
    }
    addMove() {
      ((this.objs.move = (e) => {
        this.move({
          x: e.clientX,
          y: e.clientY
        });
      }),
        document.addEventListener("mousemove", this.objs.move));
    }
    removeMove() {
      document.removeEventListener("mousemove", this.objs.move);
    }
    removeWheel() {
      document.removeEventListener("wheel", this.objs.wheel);
    }
    removeResize() {
      window.removeEventListener("resize", this.objs.resize);
    }
    removeFrame() {
      window.cancelAnimationFrame(this.request);
    }
    get object3D() {
      return this.objs.object3D;
    }
  },
  Collision = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.props = {
          hover: !1,
          disabled: !1
        }),
        (this.objs.geometry = new THREE.BoxGeometry(
          this.args.front,
          this.args.side,
          this.args.front
        )),
        (this.objs.material = new THREE.MeshBasicMaterial({
          color: 16777215,
          transparent: !0,
          opacity: 0,
          depthTest: !1
        })),
        (this.objs.mesh = new THREE.Mesh(
          this.objs.geometry,
          this.objs.material
        )),
        (this.call = (e) => {
          ("add" == e.type && this.objs.object3D.add(this.objs.mesh),
            "raycaster" == e.type &&
              ("click" == e.event &&
                0 != e.intersect.length &&
                e.intersect[0].object.uuid == this.objs.mesh.uuid &&
                this.args.callback({
                  type: "click"
                }),
              "mousemove" == e.event &&
                (0 != e.intersect.length &&
                e.intersect[0].object.uuid == this.objs.mesh.uuid
                  ? this.props.hover ||
                    ((this.props.hover = !0),
                    this.args.callback({
                      type: "mouseover"
                    }))
                  : this.props.hover &&
                    ((this.props.hover = !1),
                    this.args.callback({
                      type: "mouseout"
                    })))));
        }));
    }
  },
  LiveCast = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts = {
          ratio: "pc" == consts.responsive ? 0.6 : 1
        }),
        (this.props = {
          front: 1,
          side: 0.0625,
          x: -90,
          y: 10
        }),
        (this.objs.container = new THREE.Object3D()),
        this.objs.object3D.add(this.objs.container),
        this.objs.container.scale.set(
          this.consts.ratio,
          this.consts.ratio,
          this.consts.ratio
        ),
        (this.objs.collision = new Collision({
          render: this.objs.container,
          front: this.props.front,
          side: this.props.side,
          callback: (e) => {
            ("mouseover" == e.type &&
              this.args.callback({
                type: "mouseover"
              }),
              "mouseout" == e.type &&
                this.args.callback({
                  type: "mouseout"
                }),
              "click" == e.type &&
                this.args.callback({
                  type: "click"
                }));
          }
        })),
        (this.objs.front = Array(2).fill(null)),
        this.objs.front.forEach((e, t) => {
          this.objs.front[t] = new THREE.Mesh(
            new THREE.PlaneGeometry(this.props.front, this.props.front, 1, 1),
            new THREE.MeshBasicMaterial({
              map: this.args.texture.live[0]
            })
          );
        }),
        (this.objs.side = Array(4).fill(null)),
        this.objs.side.forEach((e, t) => {
          this.objs.side[t] = new THREE.Mesh(
            new THREE.PlaneGeometry(this.props.front, this.props.side, 1, 1),
            new THREE.MeshBasicMaterial({
              map: this.args.texture.live[1]
            })
          );
        }),
        (this.objs.front[0].position.y = this.props.side / 2),
        (this.objs.front[0].rotation.x = THREE.MathUtils.degToRad(-90)),
        (this.objs.front[0].rotation.z = THREE.MathUtils.degToRad(180)),
        (this.objs.front[1].position.y = -this.props.side / 2),
        (this.objs.front[1].rotation.x = THREE.MathUtils.degToRad(90)),
        (this.objs.side[0].position.z = -this.props.front / 2),
        (this.objs.side[0].rotation.y = THREE.MathUtils.degToRad(180)),
        (this.objs.side[1].position.x = this.props.front / 2),
        (this.objs.side[1].rotation.y = THREE.MathUtils.degToRad(90)),
        (this.objs.side[2].position.z = this.props.front / 2),
        (this.objs.side[2].rotation.y = THREE.MathUtils.degToRad(0)),
        (this.objs.side[3].position.x = -this.props.front / 2),
        (this.objs.side[3].rotation.y = THREE.MathUtils.degToRad(-90)),
        (this.objs.container.rotation.x = THREE.MathUtils.degToRad(
          this.props.x
        )),
        (this.objs.container.rotation.y = THREE.MathUtils.degToRad(
          this.props.y
        )),
        (this.call = (e) => {
          ("add" == e.type &&
            (this.objs.collision.call({
              type: "add"
            }),
            this.objs.front.forEach((e, t) => {
              this.objs.container.add(e);
            }),
            this.objs.side.forEach((e, t) => {
              this.objs.container.add(e);
            })),
            "raycaster" == e.type &&
              this.objs.collision.call({
                type: "raycaster",
                event: e.event,
                ray: e.ray,
                intersect: e.ray.intersectObjects(
                  this.objs.collision.object3D.children
                )
              }));
        }));
    }
  },
  LiveLayer = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts = {
          offset: 1,
          ratio: "pc" == consts.responsive ? 0.6 : 1
        }),
        (this.props = {
          speed: 0.15
        }),
        (this.objs.gsap = {}),
        (this.objs.container = new THREE.Object3D()),
        this.objs.object3D.add(this.objs.container),
        (this.objs.live = new LiveCast({
          render: this.objs.container,
          texture: this.args.texture,
          callback: (e) => {
            ("mouseover" == e.type &&
              this.args.callback({
                type: "mouseover"
              }),
              "mouseout" == e.type &&
                this.args.callback({
                  type: "mouseout"
                }),
              "click" == e.type &&
                this.args.callback({
                  type: "click"
                }));
          }
        })),
        this.objs.live.object3D.scale.set(0, 0, 0),
        (this.objs.gsap.scale = gsap
          .timeline({
            paused: !0
          })
          .to(this.objs.live.object3D.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 1,
            ease: Power2.easeOut
          })),
        (this.objs.live.object3D.rotation.y = THREE.MathUtils.degToRad(-720)),
        (this.objs.gsap.rotation = gsap
          .timeline({
            paused: !0
          })
          .to(this.objs.live.object3D.rotation, {
            y: 0,
            duration: 2,
            ease: Power2.easeOut
          })),
        (this.call = (e) => {
          ("add" == e.type &&
            (this.addFrame(),
            this.objs.live.call({
              type: "add"
            })),
            "show" == e.type &&
              (this.objs.gsap.scale.resume(), this.objs.gsap.rotation.resume()),
            "position" == e.type &&
              (this.objs.live.object3D.position.y = e.value),
            "offset" == e.type &&
              gsap.to(this.objs.container.position, {
                y: e.value * -this.consts.offset * this.consts.ratio,
                duration: 0.5,
                ease: Power2.easeOut
              }),
            "raycaster" == e.type &&
              this.objs.live.call({
                type: "raycaster",
                event: e.event,
                ray: e.ray
              }));
        }));
    }
    frame() {
      this.objs.container.rotation.y += THREE.MathUtils.degToRad(
        this.props.speed
      );
    }
  },
  LiveStage = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts.camera = {
          fov: 45
        }),
        (this.props = {
          fovRad: 0,
          distance: 0
        }),
        (this.props.cursor = {
          x: 0,
          y: 0
        }),
        (this.objs.scene = new THREE.Scene()),
        (this.objs.camera = new THREE.PerspectiveCamera(
          this.consts.camera.fov,
          this.args.selector.clientWidth / this.args.selector.clientHeight,
          0.01,
          2e3
        )),
        (this.objs.renderer = new THREE.WebGLRenderer({
          antialias: !(navigator.userAgent.indexOf("Android") > 0),
          alpha: !0
        })),
        this.objs.renderer.setSize(
          this.args.selector.clientWidth,
          this.args.selector.clientHeight
        ),
        this.objs.renderer.setPixelRatio(window.devicePixelRatio),
        this.args.selector.appendChild(this.objs.renderer.domElement),
        (this.objs.shaderPass = new THREE.ShaderPass({
          uniforms: {
            tDiffuse: {
              type: "t",
              value: null
            }
          },
          vertexShader: [
            "varying vec2 vUv;",
            "void main() {",
            "  vUv = uv;",
            "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
          ].join("\n"),
          fragmentShader: [
            "varying vec2 vUv;",
            "uniform sampler2D tDiffuse;",
            "void main() {",
            "  gl_FragColor = texture2D(tDiffuse, vUv);",
            "}"
          ].join("\n")
        })),
        (this.objs.composer = new THREE.EffectComposer(this.objs.renderer)),
        this.objs.composer.addPass(
          new THREE.RenderPass(this.objs.scene, this.objs.camera)
        ),
        this.objs.composer.addPass(this.objs.shaderPass),
        (this.objs.live = new LiveLayer({
          render: this.objs.scene,
          texture: this.args.texture,
          callback: (e) => {
            ("mouseover" == e.type &&
              this.args.callback({
                type: "mouseover"
              }),
              "mouseout" == e.type &&
                this.args.callback({
                  type: "mouseout"
                }),
              "click" == e.type &&
                this.args.callback({
                  type: "click"
                }));
          }
        })),
        (this.call = (e) => {
          if (
            ("add" == e.type &&
              (this.addFrame(),
              this.addResize(),
              this.objs.live.call({
                type: "add"
              })),
            "show" == e.type &&
              this.objs.live.call({
                type: "show"
              }),
            "position" == e.type &&
              this.objs.live.call({
                type: "position",
                value: e.value
              }),
            "more" == e.type &&
              (this.objs.live.call({
                type: "offset",
                value: -1
              }),
              this.args.callback({
                type: "more"
              })),
            "close" == e.type &&
              (this.objs.live.call({
                type: "offset",
                value: 0
              }),
              this.args.callback({
                type: "close"
              })),
            "mousemove" == e.type &&
              (this.props.cursor = {
                x: e.cursor.x,
                y: e.cursor.y
              }),
            "click" == e.type)
          ) {
            this.props.cursor = {
              x: e.cursor.x,
              y: e.cursor.y
            };
            let t = (e) => {
                let t = 0,
                  s = 0;
                do {
                  ((t += e.offsetTop || 0),
                    (s += e.offsetLeft || 0),
                    (e = e.offsetParent));
                } while (e);
                return {
                  top: t,
                  left: s
                };
              },
              s = new THREE.Vector3(
                ((this.props.cursor.x - t(this.objs.renderer.domElement).left) /
                  this.args.selector.clientWidth) *
                  2 -
                  1,
                (-(this.props.cursor.y - t(this.objs.renderer.domElement).top) /
                  this.args.selector.clientHeight) *
                  2 +
                  1,
                1
              );
            s.unproject(this.objs.camera);
            let o = new THREE.Raycaster(
              this.objs.camera.position,
              s.sub(this.objs.camera.position).normalize()
            );
            this.objs.live.call({
              type: "raycaster",
              event: "click",
              ray: o
            });
          }
        }));
    }
    frame() {
      if (
        (this.objs.renderer.render(this.objs.scene, this.objs.camera),
        "pc" == consts.device)
      ) {
        let e = (e) => {
            let t = 0,
              s = 0;
            do {
              ((t += e.offsetTop || 0),
                (s += e.offsetLeft || 0),
                (e = e.offsetParent));
            } while (e);
            return {
              top: t,
              left: s
            };
          },
          t = new THREE.Vector3(
            ((this.props.cursor.x - e(this.objs.renderer.domElement).left) /
              this.args.selector.clientWidth) *
              2 -
              1,
            (-(this.props.cursor.y - e(this.objs.renderer.domElement).top) /
              this.args.selector.clientHeight) *
              2 +
              1,
            1
          );
        t.unproject(this.objs.camera);
        let s = new THREE.Raycaster(
          this.objs.camera.position,
          t.sub(this.objs.camera.position).normalize()
        );
        this.objs.live.call({
          type: "raycaster",
          event: "mousemove",
          ray: s
        });
      }
    }
    resize() {
      ((this.objs.camera.aspect =
        this.args.selector.clientWidth / this.args.selector.clientHeight),
        this.objs.camera.updateProjectionMatrix(),
        this.objs.renderer.setSize(
          this.args.selector.clientWidth,
          this.args.selector.clientHeight
        ),
        (this.props.radian = (this.objs.camera.fov / 2) * (Math.PI / 180)),
        (this.props.distance = 0.5 / Math.tan(this.props.radian)),
        (this.objs.camera.position.z =
          this.props.distance /
          ((window.innerWidth < 1920 ? window.innerWidth : 1920) / 1920)));
    }
  },
  ItemMusicCast = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts = {
          front: 1,
          side: "pc" == consts.responsive ? 0.064 : 0.096,
          ratio: "pc" == consts.responsive ? 0.6 : 1
        }),
        (this.objs.container = new THREE.Object3D()),
        this.objs.object3D.add(this.objs.container),
        this.objs.container.scale.set(
          this.consts.ratio,
          this.consts.ratio,
          this.consts.ratio
        ),
        (this.objs.front = Array(2).fill(null)),
        this.objs.front.forEach((e, t) => {
          "" != this.args.label[this.args.index]
            ? (this.objs.front[t] = new THREE.Mesh(
                new THREE.PlaneGeometry(
                  this.consts.front,
                  this.consts.front,
                  1,
                  1
                ),
                new THREE.MeshPhongMaterial({
                  map: this.args.texture.front[this.args.index],
                  side: THREE.DoubleSide
                })
              ))
            : (this.objs.front[t] = new THREE.Mesh(
                new THREE.PlaneGeometry(
                  this.consts.front,
                  this.consts.front,
                  1,
                  1
                ),
                new THREE.MeshPhongMaterial({
                  map: this.args.texture.front[this.args.index],
                  transparent: !0,
                  side: THREE.DoubleSide,
                  depthWrite: !1
                })
              ));
        }),
        (this.objs.side = Array(4).fill(null)),
        this.objs.side.forEach((e, t) => {
          ("sd" == consts.responsive &&
            (this.args.texture.side[this.args.index].repeat.set(0.66, 1),
            (this.args.texture.side[this.args.index].offset.x = 0.165)),
            "" != this.args.label[this.args.index]
              ? (this.objs.side[t] = new THREE.Mesh(
                  new THREE.PlaneGeometry(
                    this.consts.front,
                    this.consts.side,
                    1,
                    1
                  ),
                  new THREE.MeshPhongMaterial({
                    map: this.args.texture.side[this.args.index],
                    side: THREE.DoubleSide
                  })
                ))
              : (this.objs.side[t] = new THREE.Mesh(
                  new THREE.PlaneGeometry(
                    this.consts.front,
                    this.consts.side,
                    1,
                    1
                  ),
                  new THREE.MeshPhongMaterial({
                    map: this.args.texture.side[this.args.index],
                    transparent: !0,
                    side: THREE.DoubleSide,
                    depthWrite: !1,
                    blending: THREE.CustomBlending,
                    blendSrc: THREE.OneFactor,
                    blendDst: THREE.OneMinusSrcAlphaFactor,
                    blendEquation: THREE.AddEquation
                  })
                )));
        }),
        (this.objs.front[0].position.y = this.consts.side / 2),
        (this.objs.front[0].rotation.x = THREE.MathUtils.degToRad(-90)),
        (this.objs.front[0].rotation.z = THREE.MathUtils.degToRad(180)),
        (this.objs.front[1].position.y = -this.consts.side / 2),
        (this.objs.front[1].rotation.x = THREE.MathUtils.degToRad(90)),
        (this.objs.side[0].position.z = -this.consts.front / 2),
        (this.objs.side[0].rotation.y = THREE.MathUtils.degToRad(180)),
        (this.objs.side[1].position.x = this.consts.front / 2),
        (this.objs.side[1].rotation.y = THREE.MathUtils.degToRad(90)),
        (this.objs.side[2].position.z = this.consts.front / 2),
        (this.objs.side[2].rotation.y = THREE.MathUtils.degToRad(0)),
        (this.objs.side[3].position.x = -this.consts.front / 2),
        (this.objs.side[3].rotation.y = THREE.MathUtils.degToRad(-90)),
        (this.objs.collision = new Collision({
          render: this.objs.container,
          front: this.consts.front,
          side: this.consts.side,
          callback: (e) => {
            ("mouseover" == e.type &&
              (this.objs.front.forEach((e, t) => {
                gsap.to(e.material, {
                  shininess: 50,
                  duration: 0.125,
                  ease: Power0.easeNone
                });
              }),
              this.objs.side.forEach((e, t) => {
                gsap.to(e.material, {
                  shininess: 50,
                  duration: 0.125,
                  ease: Power0.easeNone
                });
              }),
              this.args.callback({
                type: "mouseover"
              })),
              "mouseout" == e.type &&
                (this.objs.front.forEach((e, t) => {
                  gsap.to(e.material, {
                    shininess: 30,
                    duration: 0.125,
                    ease: Power0.easeNone
                  });
                }),
                this.objs.side.forEach((e, t) => {
                  gsap.to(e.material, {
                    shininess: 30,
                    duration: 0.125,
                    ease: Power0.easeNone
                  });
                }),
                this.args.callback({
                  type: "mouseout"
                })),
              "click" == e.type &&
                this.args.callback({
                  type: "click",
                  index: this.args.index
                }));
          }
        })),
        (this.call = (e) => {
          ("add" == e.type &&
            (this.objs.front.forEach((e, t) => {
              this.objs.container.add(e);
            }),
            this.objs.side.forEach((e, t) => {
              this.objs.container.add(e);
            }),
            "" != this.args.label[this.args.index] &&
              this.objs.collision.call({
                type: "add"
              })),
            "raycaster" == e.type &&
              this.objs.collision.call({
                type: "raycaster",
                event: e.event,
                ray: e.ray,
                intersect: e.intersect
              }));
        }));
    }
  },
  ItemMusicLayer = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts = {
          x: -90,
          y: 5,
          speed: 0.6,
          offset: 0.5,
          ratio: "pc" == consts.responsive ? 0.6 : 1
        }),
        (this.props = {
          isRotation: !1
        }),
        (this.objs.gsap = {}),
        (this.objs.container = new THREE.Object3D()),
        this.objs.object3D.add(this.objs.container),
        (this.objs.item = new ItemMusicCast({
          render: this.objs.container,
          label: this.args.label,
          texture: this.args.texture,
          index: this.args.index,
          callback: (e) => {
            ("mouseover" == e.type &&
              this.args.callback({
                type: "mouseover"
              }),
              "mouseout" == e.type &&
                this.args.callback({
                  type: "mouseout"
                }),
              "click" == e.type &&
                this.args.callback({
                  type: "click",
                  index: e.index
                }));
          }
        })),
        this.objs.item.object3D.scale.set(0, 0, 0),
        (this.objs.gsap.scale = gsap
          .timeline({
            paused: !0
          })
          .to(this.objs.item.object3D.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.5,
            ease: Power2.easeOut
          })),
        (this.objs.item.object3D.rotation.y = THREE.MathUtils.degToRad(-360)),
        (this.objs.gsap.rotation = gsap
          .timeline({
            paused: !0
          })
          .to(this.objs.item.object3D.rotation, {
            y: 0,
            duration: 1.5,
            ease: Power2.easeOut
          })),
        (this.call = (e) => {
          ("add" == e.type &&
            (this.addFrame(),
            this.objs.item.call({
              type: "add"
            })),
            "show" == e.type &&
              (this.objs.gsap.scale.resume(), this.objs.gsap.rotation.resume()),
            "offset" == e.type &&
              gsap.to(this.objs.container.position, {
                y: e.value * -this.consts.offset * this.consts.ratio,
                duration: 0.5,
                ease: Power2.easeOut
              }),
            "enabled" == e.type &&
              ((this.props.isRotation = !0),
              gsap.to(this.objs.container.rotation, {
                x: THREE.MathUtils.degToRad(this.consts.x),
                duration: 0.5,
                ease: Power2.easeOut
              }),
              gsap.to(this.objs.container.rotation, {
                y: THREE.MathUtils.degToRad(this.consts.y),
                duration: 0.5,
                ease: Power2.easeOut
              }),
              gsap.to(this.objs.container.rotation, {
                z: 0,
                duration: 0.5,
                ease: Power2.easeOut
              })),
            "disabled" == e.type &&
              ((this.props.isRotation = !1),
              gsap.to(this.objs.container.rotation, {
                x: 0,
                duration: 0.5,
                ease: Power2.easeOut
              }),
              gsap.to(this.objs.container.rotation, {
                y: 0,
                duration: 0.5,
                ease: Power2.easeOut
              }),
              gsap.to(this.objs.container.rotation, {
                z: 0,
                duration: 0.5,
                ease: Power2.easeOut
              })),
            "raycaster" == e.type &&
              this.objs.item.call({
                type: "raycaster",
                event: e.event,
                ray: e.ray,
                intersect: e.intersect
              }));
        }));
    }
    frame() {
      this.props.isRotation &&
        (this.objs.container.rotation.z += THREE.MathUtils.degToRad(
          this.consts.speed
        ));
    }
  },
  ListMusicLayer = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts = {
          between: "pc" == consts.responsive ? 0.128 : 0.256,
          ratio: "pc" == consts.responsive ? 0.6 : 1
        }),
        (this.props.label = [
          "20221012",
          "20220912",
          "20220720",
          "20220525",
          "20220420",
          "20220309",
          "20220216",
          "20220119",
          "",
          "20211203",
          "20211022",
          "20210929",
          "20210928",
          "20210723",
          "20210317",
          "20210127",
          "",
          "20201218",
          "20200930",
          "20200722",
          "20200630",
          "20200527",
          "20200325",
          "20200212",
          "",
          "20191122",
          "20190920",
          "20190626",
          "20190529",
          "20190410",
          "20190313",
          "20190306",
          "20190227",
          "20190126",
          "20190109",
          "",
          "20181116",
          "20180831",
          "20180801",
          "20180718",
          "20180701",
          "20180516",
          "",
          "20171101",
          "20170927"
        ]),
        (this.props.current = ""),
        (this.objs.container = new THREE.Object3D()),
        this.objs.object3D.add(this.objs.container),
        (this.objs.item = Array(this.props.label.length).fill(null)),
        this.objs.item.forEach((e, t) => {
          ((this.objs.item[t] = new ItemMusicLayer({
            render: this.objs.container,
            label: this.props.label,
            texture: this.args.texture,
            index: t,
            callback: (e) => {
              ("mouseover" == e.type &&
                this.args.callback({
                  type: "mouseover"
                }),
                "mouseout" == e.type &&
                  this.args.callback({
                    type: "mouseout"
                  }),
                "click" == e.type &&
                  (this.props.label[e.index] == this.props.current
                    ? ((this.props.current = "99999999"),
                      "pc" == consts.responsive &&
                        gsap.to(this.objs.container.position, {
                          x: 3 * -this.consts.between,
                          duration: 0.5,
                          ease: Power2.easeOut
                        }),
                      this.args.callback({
                        type: "open"
                      }))
                    : ((this.props.current = this.props.label[e.index]),
                      this.objs.item.forEach((t, s) => {
                        (s < e.index &&
                          (this.objs.item[s].call({
                            type: "offset",
                            value: -1
                          }),
                          this.objs.item[s].call({
                            type: "disabled"
                          })),
                          s == e.index &&
                            (this.objs.item[s].call({
                              type: "offset",
                              value: 0
                            }),
                            this.objs.item[s].call({
                              type: "enabled"
                            })),
                          s > e.index &&
                            (this.objs.item[s].call({
                              type: "offset",
                              value: 1
                            }),
                            this.objs.item[s].call({
                              type: "disabled"
                            })),
                          gsap.to(this.objs.item[s].object3D.rotation, {
                            y: 0,
                            duration: 0.5,
                            ease: Power2.easeOut
                          }));
                      }),
                      this.args.callback({
                        type: "more",
                        label: this.props.label[e.index],
                        worldPosition: this.objs.item[
                          t
                        ].object3D.getWorldPosition(new THREE.Vector3())
                      }))));
            }
          })),
            (this.objs.item[t].object3D.position.y =
              -this.consts.between * this.consts.ratio * t));
        }),
        (this.call = (e) => {
          ("add" == e.type &&
            (this.addFrame(),
            this.objs.item.forEach((e, t) => {
              e.call({
                type: "add"
              });
            })),
            "show" == e.type &&
              this.objs.item.forEach((e, t) => {
                setTimeout(() => {
                  e.call({
                    type: "show"
                  });
                }, 50 * t);
              }),
            "open" == e.type &&
              ((this.props.current = "99999999"),
              "pc" == consts.responsive &&
                gsap.to(this.objs.container.position, {
                  x: 3 * -this.consts.between,
                  duration: 0.5,
                  ease: Power2.easeOut
                }),
              this.args.callback({
                type: "open"
              })),
            "close" == e.type &&
              ((this.props.current = ""),
              gsap.to(this.objs.container.position, {
                x: 0,
                duration: 0.5,
                ease: Power2.easeOut
              }),
              this.objs.item.forEach((e, t) => {
                (this.objs.item[t].call({
                  type: "offset",
                  value: 0
                }),
                  this.objs.item[t].call({
                    type: "disabled"
                  }));
              }),
              this.args.callback({
                type: "close"
              })),
            "raycaster" == e.type &&
              this.objs.item.forEach((t, s) => {
                t.call({
                  type: "raycaster",
                  event: e.event,
                  ray: e.ray,
                  intersect: e.ray.intersectObjects(
                    this.objs.container.children
                  )
                });
              }));
        }));
    }
    frame() {
      "" == this.props.current &&
        this.objs.item.forEach((e, t) => {
          e.object3D.rotation.y +=
            0.05 *
            (1 *
              (Math.sin(performance.now() / 5e3 + 0.05 * t) * Math.PI -
                Math.PI) -
              e.object3D.rotation.y);
        });
    }
  },
  MusicLayer = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.objs.container = new THREE.Object3D()),
        this.objs.object3D.add(this.objs.container),
        (this.objs.list = new ListMusicLayer({
          render: this.objs.container,
          texture: this.args.texture,
          callback: (e) => {
            ("mouseover" == e.type &&
              this.args.callback({
                type: "mouseover"
              }),
              "mouseout" == e.type &&
                this.args.callback({
                  type: "mouseout"
                }),
              "more" == e.type &&
                this.args.callback({
                  type: "more",
                  label: e.label,
                  worldPosition: e.worldPosition
                }),
              "open" == e.type &&
                this.args.callback({
                  type: "open"
                }),
              "close" == e.type &&
                this.args.callback({
                  type: "close"
                }));
          }
        })),
        (this.call = (e) => {
          ("add" == e.type &&
            this.objs.list.call({
              type: "add"
            }),
            "show" == e.type &&
              this.objs.list.call({
                type: "show"
              }),
            "position" == e.type &&
              (this.objs.list.object3D.position.y = e.value),
            "open" == e.type &&
              this.objs.list.call({
                type: "open"
              }),
            "close" == e.type &&
              this.objs.list.call({
                type: "close"
              }),
            "raycaster" == e.type &&
              this.objs.list.call({
                type: "raycaster",
                event: e.event,
                ray: e.ray
              }));
        }));
    }
  },
  MusicStage = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts.camera = {
          fov: 45
        }),
        (this.props = {
          fovRad: 0,
          distance: 0
        }),
        (this.props.cursor = {
          x: 0,
          y: 0
        }),
        (this.objs.scene = new THREE.Scene()),
        (this.objs.camera = new THREE.PerspectiveCamera(
          this.consts.camera.fov,
          this.args.selector.clientWidth / this.args.selector.clientHeight,
          0.01,
          2e3
        )),
        (this.objs.ambientLight = new THREE.AmbientLight(15790330, 0.625)),
        this.objs.scene.add(this.objs.ambientLight),
        (this.objs.directionalLight = new THREE.DirectionalLight(
          15790330,
          0.375
        )),
        (this.objs.directionalLight.position.x = 0),
        (this.objs.directionalLight.position.y = 0),
        this.objs.scene.add(this.objs.directionalLight),
        (this.objs.renderer = new THREE.WebGLRenderer({
          antialias: !(navigator.userAgent.indexOf("Android") > 0),
          alpha: !0
        })),
        this.objs.renderer.setSize(
          this.args.selector.clientWidth,
          this.args.selector.clientHeight
        ),
        this.objs.renderer.setPixelRatio(window.devicePixelRatio),
        this.args.selector.appendChild(this.objs.renderer.domElement),
        (this.objs.shaderPass = new THREE.ShaderPass({
          uniforms: {
            tDiffuse: {
              type: "t",
              value: null
            }
          },
          vertexShader: [
            "varying vec2 vUv;",
            "void main() {",
            "  vUv = uv;",
            "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
          ].join("\n"),
          fragmentShader: [
            "varying vec2 vUv;",
            "uniform sampler2D tDiffuse;",
            "void main() {",
            "  gl_FragColor = texture2D(tDiffuse, vUv);",
            "}"
          ].join("\n")
        })),
        (this.objs.composer = new THREE.EffectComposer(this.objs.renderer)),
        this.objs.composer.addPass(
          new THREE.RenderPass(this.objs.scene, this.objs.camera)
        ),
        this.objs.composer.addPass(this.objs.shaderPass),
        (this.objs.music = new MusicLayer({
          render: this.objs.scene,
          texture: this.args.texture,
          callback: (e) => {
            ("mouseover" == e.type &&
              this.args.callback({
                type: "mouseover"
              }),
              "mouseout" == e.type &&
                this.args.callback({
                  type: "mouseout"
                }),
              "more" == e.type &&
                this.args.callback({
                  type: "more",
                  label: e.label,
                  y:
                    e.worldPosition.project(this.objs.camera).y *
                    (this.args.selector.clientHeight / 2)
                }),
              "open" == e.type &&
                this.args.callback({
                  type: "open"
                }),
              "close" == e.type &&
                this.args.callback({
                  type: "close"
                }));
          }
        })),
        (this.call = (e) => {
          if (
            ("add" == e.type &&
              (this.addFrame(),
              this.addResize(),
              this.objs.music.call({
                type: "add"
              })),
            "show" == e.type &&
              this.objs.music.call({
                type: "show"
              }),
            "position" == e.type &&
              this.objs.music.call({
                type: "position",
                value: e.value
              }),
            "open" == e.type &&
              this.objs.music.call({
                type: "open"
              }),
            "close" == e.type &&
              this.objs.music.call({
                type: "close"
              }),
            "mousemove" == e.type &&
              (this.props.cursor = {
                x: e.cursor.x,
                y: e.cursor.y
              }),
            "click" == e.type)
          ) {
            this.props.cursor = {
              x: e.cursor.x,
              y: e.cursor.y
            };
            let t = (e) => {
                let t = 0,
                  s = 0;
                do {
                  ((t += e.offsetTop || 0),
                    (s += e.offsetLeft || 0),
                    (e = e.offsetParent));
                } while (e);
                return {
                  top: t,
                  left: s
                };
              },
              s = new THREE.Vector3(
                ((this.props.cursor.x - t(this.objs.renderer.domElement).left) /
                  this.args.selector.clientWidth) *
                  2 -
                  1,
                (-(this.props.cursor.y - t(this.objs.renderer.domElement).top) /
                  this.args.selector.clientHeight) *
                  2 +
                  1,
                1
              );
            s.unproject(this.objs.camera);
            let o = new THREE.Raycaster(
              this.objs.camera.position,
              s.sub(this.objs.camera.position).normalize()
            );
            this.objs.music.call({
              type: "raycaster",
              event: "click",
              ray: o
            });
          }
        }));
    }
    frame() {
      if (
        (this.objs.renderer.render(this.objs.scene, this.objs.camera),
        "pc" == consts.device)
      ) {
        let e = (e) => {
            let t = 0,
              s = 0;
            do {
              ((t += e.offsetTop || 0),
                (s += e.offsetLeft || 0),
                (e = e.offsetParent));
            } while (e);
            return {
              top: t,
              left: s
            };
          },
          t = new THREE.Vector3(
            ((this.props.cursor.x - e(this.objs.renderer.domElement).left) /
              this.args.selector.clientWidth) *
              2 -
              1,
            (-(this.props.cursor.y - e(this.objs.renderer.domElement).top) /
              this.args.selector.clientHeight) *
              2 +
              1,
            1
          );
        t.unproject(this.objs.camera);
        let s = new THREE.Raycaster(
          this.objs.camera.position,
          t.sub(this.objs.camera.position).normalize()
        );
        this.objs.music.call({
          type: "raycaster",
          event: "mousemove",
          ray: s
        });
      }
    }
    resize() {
      ((this.objs.camera.aspect =
        this.args.selector.clientWidth / this.args.selector.clientHeight),
        this.objs.camera.updateProjectionMatrix(),
        this.objs.renderer.setSize(
          this.args.selector.clientWidth,
          this.args.selector.clientHeight
        ),
        (this.props.radian = (this.objs.camera.fov / 2) * (Math.PI / 180)),
        (this.props.distance = 0.5 / Math.tan(this.props.radian)),
        (this.objs.camera.position.z =
          this.props.distance /
          ((window.innerWidth < 1920 ? window.innerWidth : 1920) / 1920)),
        (this.objs.directionalLight.position.z =
          this.props.distance /
          ((window.innerWidth < 1920 ? window.innerWidth : 1920) / 1920)));
    }
  },
  Page = class extends Renderer {
    constructor(e) {
      (super(e),
        (this.consts.perspective = {
          amount: -15,
          rate: 0.1
        }),
        (this.consts.client = {
          rate: 0.1
        }),
        (this.props.loading = {
          total: 0,
          count: 0
        }),
        (this.props.perspective = {
          dest: 0,
          value: 0
        }),
        (this.props.client = {
          dest: {
            x: 0,
            y: 0
          },
          value: {
            x: 0,
            y: 0
          }
        }),
        (this.objs.gsap = {}),
        (this.objs.locomotive = {}),
        (this.objs.animationFrame = {}),
        (this.objs.intersectionObserver = {}),
        (this.objs.texture = {
          live: [
            "./asset/img/canvas/front/00000000.jpg",
            "./asset/img/canvas/side/00000000.jpg"
          ],
          front: [
            "./asset/img/canvas/front/20221012.jpg",
            "./asset/img/canvas/front/20220912.jpg",
            "./asset/img/canvas/front/20220720.jpg",
            "./asset/img/canvas/front/20220525.jpg",
            "./asset/img/canvas/front/20220420.jpg",
            "./asset/img/canvas/front/20220309.jpg",
            "./asset/img/canvas/front/20220216.jpg",
            "./asset/img/canvas/front/20220119.jpg",
            "./asset/img/canvas/front/20220000.png",
            "./asset/img/canvas/front/20211203.jpg",
            "./asset/img/canvas/front/20211022.jpg",
            "./asset/img/canvas/front/20210929.jpg",
            "./asset/img/canvas/front/20210928.jpg",
            "./asset/img/canvas/front/20210723.jpg",
            "./asset/img/canvas/front/20210317.jpg",
            "./asset/img/canvas/front/20210127.jpg",
            "./asset/img/canvas/front/20210000.png",
            "./asset/img/canvas/front/20201218.jpg",
            "./asset/img/canvas/front/20200930.jpg",
            "./asset/img/canvas/front/20200722.jpg",
            "./asset/img/canvas/front/20200630.jpg",
            "./asset/img/canvas/front/20200527.jpg",
            "./asset/img/canvas/front/20200325.jpg",
            "./asset/img/canvas/front/20200212.jpg",
            "./asset/img/canvas/front/20200000.png",
            "./asset/img/canvas/front/20191122.jpg",
            "./asset/img/canvas/front/20190920.jpg",
            "./asset/img/canvas/front/20190626.jpg",
            "./asset/img/canvas/front/20190529.jpg",
            "./asset/img/canvas/front/20190410.jpg",
            "./asset/img/canvas/front/20190313.jpg",
            "./asset/img/canvas/front/20190306.jpg",
            "./asset/img/canvas/front/20190227.jpg",
            "./asset/img/canvas/front/20190126.jpg",
            "./asset/img/canvas/front/20190109.jpg",
            "./asset/img/canvas/front/20190000.png",
            "./asset/img/canvas/front/20181116.jpg",
            "./asset/img/canvas/front/20180831.jpg",
            "./asset/img/canvas/front/20180801.jpg",
            "./asset/img/canvas/front/20180718.jpg",
            "./asset/img/canvas/front/20180701.jpg",
            "./asset/img/canvas/front/20180516.jpg",
            "./asset/img/canvas/front/20180000.png",
            "./asset/img/canvas/front/20171101.jpg",
            "./asset/img/canvas/front/20170927.jpg"
          ],
          side: [
            "./asset/img/canvas/side/20221012.jpg",
            "./asset/img/canvas/side/20220912.jpg",
            "./asset/img/canvas/side/20220720.jpg",
            "./asset/img/canvas/side/20220525.jpg",
            "./asset/img/canvas/side/20220420.jpg",
            "./asset/img/canvas/side/20220309.jpg",
            "./asset/img/canvas/side/20220216.jpg",
            "./asset/img/canvas/side/20220119.jpg",
            "./asset/img/canvas/side/20220000.png",
            "./asset/img/canvas/side/20211203.jpg",
            "./asset/img/canvas/side/20211022.jpg",
            "./asset/img/canvas/side/20210929.jpg",
            "./asset/img/canvas/side/20210928.jpg",
            "./asset/img/canvas/side/20210723.jpg",
            "./asset/img/canvas/side/20210317.jpg",
            "./asset/img/canvas/side/20210127.jpg",
            "./asset/img/canvas/side/20210000.png",
            "./asset/img/canvas/side/20201218.jpg",
            "./asset/img/canvas/side/20200930.jpg",
            "./asset/img/canvas/side/20200722.jpg",
            "./asset/img/canvas/side/20200630.jpg",
            "./asset/img/canvas/side/20200527.jpg",
            "./asset/img/canvas/side/20200325.jpg",
            "./asset/img/canvas/side/20200212.jpg",
            "./asset/img/canvas/side/20200000.png",
            "./asset/img/canvas/side/20191122.jpg",
            "./asset/img/canvas/side/20190920.jpg",
            "./asset/img/canvas/side/20190626.jpg",
            "./asset/img/canvas/side/20190529.jpg",
            "./asset/img/canvas/side/20190410.jpg",
            "./asset/img/canvas/side/20190313.jpg",
            "./asset/img/canvas/side/20190306.jpg",
            "./asset/img/canvas/side/20190227.jpg",
            "./asset/img/canvas/side/20190126.jpg",
            "./asset/img/canvas/side/20190109.jpg",
            "./asset/img/canvas/side/20190000.png",
            "./asset/img/canvas/side/20181116.jpg",
            "./asset/img/canvas/side/20180831.jpg",
            "./asset/img/canvas/side/20180801.jpg",
            "./asset/img/canvas/side/20180718.jpg",
            "./asset/img/canvas/side/20180701.jpg",
            "./asset/img/canvas/side/20180516.jpg",
            "./asset/img/canvas/side/20180000.png",
            "./asset/img/canvas/side/20171101.jpg",
            "./asset/img/canvas/side/20170927.jpg"
          ]
        }),
        (this.call = (e) => {
          if ("load" == e.type) {
            for (let e in this.objs.texture)
              this.props.loading.total += this.objs.texture[e].length;
            for (let e in this.objs.texture)
              for (let t = 0; t < this.objs.texture[e].length; t++)
                this.objs.texture[e][t] = new THREE.TextureLoader().load(
                  this.objs.texture[e][t],
                  (e) => {
                    (this.props.loading.count++,
                      this.props.loading.count == this.props.loading.total &&
                        this.args.callback({
                          type: "loaded"
                        }));
                  }
                );
          }
          ("render" == e.type &&
            ((this.objs.liveStage = new LiveStage({
              selector: document.querySelector(".page-canvas .canvas-live"),
              texture: this.objs.texture,
              callback: (e) => {
                ("mouseover" == e.type &&
                  document
                    .querySelector(".page-main")
                    .classList.add("is-pointer"),
                  "mouseout" == e.type &&
                    document
                      .querySelector(".page-main")
                      .classList.remove("is-pointer"),
                  "click" == e.type &&
                    (document
                      .querySelector(".page-loading")
                      .classList.remove("is-inactive"),
                    setTimeout(() => {
                      window.location.href = "../roll-and-bounce/";
                    }, 1e3)),
                  "more" == e.type &&
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                      )
                      .classList.remove("is-active"),
                  "close" == e.type &&
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                      )
                      .classList.add("is-active"));
              }
            })),
            (this.objs.musicStage = new MusicStage({
              selector: document.querySelector(".page-canvas .canvas-music"),
              texture: this.objs.texture,
              callback: (e) => {
                ("mouseover" == e.type &&
                  setTimeout(() => {
                    document
                      .querySelector(".page-main")
                      .classList.add("is-pointer");
                  }, 0),
                  "mouseout" == e.type &&
                    document
                      .querySelector(".page-main")
                      .classList.remove("is-pointer"),
                  "more" == e.type &&
                    (document
                      .querySelector(".page-view button")
                      .setAttribute("data-index", e.label),
                    document
                      .querySelector(".page-view")
                      .classList.add("is-active"),
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-gradient"
                      )
                      .setAttribute("data-index", e.label),
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-gradient"
                      )
                      .classList.add("is-active"),
                    setTimeout(() => {
                      (document
                        .querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-ticker"
                        )
                        .setAttribute("data-index", e.label),
                        document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-ticker"
                          )
                          .classList.add("is-active"));
                    }, 500),
                    "pc" == consts.device &&
                      this.objs.locomotive.page.scrollTo(
                        this.objs.locomotive.page.scroll.instance.scroll.y -
                          e.y,
                        {
                          duration: 500,
                          easing: [0.215, 0.61, 0.355, 1]
                        }
                      ),
                    "sd" == consts.device &&
                      gsap.to(document.scrollingElement, {
                        scrollTop: document.scrollingElement.scrollTop - e.y,
                        duration: 0.5,
                        ease: Power2.easeOut
                      }),
                    this.objs.liveStage.call({
                      type: "more"
                    }),
                    this.objs.sound.pause(),
                    this.objs.sound.play({
                      label: e.label
                    })),
                  "open" == e.type &&
                    (document
                      .querySelectorAll(
                        ".page-modal .modal-container .container-scroll .scroll-container .container-main"
                      )
                      .forEach((e, t) => {
                        e.classList.remove("is-active");
                      }),
                    setTimeout(() => {
                      (document
                        .querySelectorAll(
                          ".page-modal .modal-container .container-scroll .scroll-container .container-main"
                        )
                        .forEach((e, t) => {
                          e.getAttribute("data-index") ==
                            document
                              .querySelector(".page-view button")
                              .getAttribute("data-index") &&
                            e.classList.add("is-active");
                        }),
                        "pc" == consts.device &&
                          this.objs.locomotive.modal.update(),
                        "pc" == consts.device &&
                          this.objs.locomotive.modal.scrollTo(0, {
                            duration: 0
                          }),
                        "sd" == consts.device &&
                          gsap.to(
                            document.querySelector(
                              ".page-modal .modal-container .container-scroll"
                            ),
                            {
                              scrollTop: 0,
                              duration: 0,
                              ease: Power0.easeNone
                            }
                          ),
                        document
                          .querySelector(".page-toggle")
                          .classList.add("is-inactive"),
                        document
                          .querySelector(".page-audio")
                          .classList.remove("is-active"),
                        document
                          .querySelector(".page-view")
                          .classList.remove("is-active"),
                        document
                          .querySelector(".page-modal")
                          .classList.add("is-active"));
                    }, 10)),
                  "close" == e.type &&
                    (document
                      .querySelector(".page-view button")
                      .removeAttribute("data-index"),
                    document
                      .querySelector(".page-view")
                      .classList.remove("is-active"),
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-ticker"
                      )
                      .classList.remove("is-active"),
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-gradient"
                      )
                      .classList.remove("is-active"),
                    setTimeout(() => {
                      (document
                        .querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-ticker"
                        )
                        .removeAttribute("data-index"),
                        document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-background .background-music .music-gradient"
                          )
                          .removeAttribute("data-index"));
                    }, 500),
                    document
                      .querySelector(".page-toggle")
                      .classList.remove("is-inactive"),
                    document
                      .querySelector(".page-audio")
                      .classList.add("is-active"),
                    document
                      .querySelector(".page-modal")
                      .classList.remove("is-active"),
                    document
                      .querySelector(".page-modal .modal-background div")
                      .classList.remove("is-active"),
                    this.objs.sound.pause()));
              }
            })),
            (this.objs.sound = new Sound({
              callback: (e) => {}
            })),
            this.args.callback({
              type: "rendered"
            })),
            "build" == e.type &&
              ("pc" == consts.device &&
                (setTimeout(() => {
                  ((this.objs.intersectionObserver.header =
                    new IntersectionObserver(
                      (e, t) => {
                        e.forEach((e) => {
                          e.isIntersecting &&
                            (e.target.classList.add("is-trigger"),
                            this.objs.intersectionObserver.header.unobserve(
                              e.target
                            ));
                        });
                      },
                      {
                        root: null,
                        rootMargin: "-20% 0%"
                      }
                    )),
                    document
                      .querySelectorAll(".section-header [data-trigger]")
                      .forEach((e, t) => {
                        this.objs.intersectionObserver.header.observe(e);
                      }));
                }, 2e3),
                (this.objs.intersectionObserver.arrow =
                  new IntersectionObserver(
                    (e, t) => {
                      e.forEach((e) => {
                        e.isIntersecting
                          ? document
                              .querySelector(".page-arrow")
                              .classList.add("is-inactive")
                          : document
                              .querySelector(".page-arrow")
                              .classList.remove("is-inactive");
                      });
                    },
                    {
                      root: null,
                      rootMargin: "1% 0% -101% 0%"
                    }
                  )),
                document
                  .querySelectorAll(".page-main .main-scroll .scroll-container")
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.arrow.observe(e);
                  }),
                (this.objs.intersectionObserver.main = new IntersectionObserver(
                  (e, t) => {
                    e.forEach((e) => {
                      e.isIntersecting
                        ? (document
                            .querySelector(".page-audio")
                            .classList.add("is-active"),
                          document
                            .querySelector(
                              ".page-main .main-scroll .scroll-container .container-section .section-background .background-distortion"
                            )
                            .classList.add("is-active"))
                        : (document
                            .querySelector(".page-audio")
                            .classList.remove("is-active"),
                          document
                            .querySelector(
                              ".page-main .main-scroll .scroll-container .container-section .section-background .background-distortion"
                            )
                            .classList.remove("is-active"));
                    });
                  },
                  {
                    root: null,
                    rootMargin: "-50% 0%"
                  }
                )),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-main"
                  )
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.main.observe(e);
                  }),
                (this.objs.intersectionObserver.live = new IntersectionObserver(
                  (e, t) => {
                    e.forEach((e) => {
                      e.isIntersecting &&
                        (document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                          )
                          .classList.add("is-active"),
                        this.objs.liveStage.call({
                          type: "show"
                        }),
                        this.objs.intersectionObserver.live.unobserve(
                          e.target
                        ));
                    });
                  },
                  {
                    root: null,
                    rootMargin: "-20% 0%"
                  }
                )),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                  )
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.live.observe(e);
                  }),
                (this.objs.intersectionObserver.music =
                  new IntersectionObserver(
                    (e, t) => {
                      e.forEach((e) => {
                        e.isIntersecting &&
                          (this.objs.musicStage.call({
                            type: "show"
                          }),
                          this.objs.intersectionObserver.music.unobserve(
                            e.target
                          ));
                      });
                    },
                    {
                      root: null,
                      rootMargin: "-20% 0%"
                    }
                  )),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-main .main-music"
                  )
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.music.observe(e);
                  }),
                (this.objs.intersectionObserver.footer =
                  new IntersectionObserver(
                    (e, t) => {
                      e.forEach((e) => {
                        e.isIntersecting &&
                          (e.target.classList.add("is-trigger"),
                          this.objs.intersectionObserver.footer.unobserve(
                            e.target
                          ));
                      });
                    },
                    {
                      root: null,
                      rootMargin: "-20% 0%"
                    }
                  )),
                document
                  .querySelectorAll(".section-footer [data-trigger]")
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.footer.observe(e);
                  }),
                gsap.registerPlugin(ScrollTrigger),
                (this.objs.locomotive.roots = new LocomotiveScroll({
                  el: document.querySelector(
                    ".page-roots .roots-container .container-scroll .scroll-container"
                  ),
                  scrollbarContainer: document.querySelector(
                    ".page-roots .roots-container .container-scroll"
                  ),
                  smooth: !0,
                  mobile: {
                    breakpoint: 0
                  },
                  tablet: {
                    breakpoint: 0
                  }
                })),
                (this.objs.locomotive.modal = new LocomotiveScroll({
                  el: document.querySelector(
                    ".page-modal .modal-container .container-scroll .scroll-container"
                  ),
                  scrollbarContainer: document.querySelector(
                    ".page-modal .modal-container .container-scroll"
                  ),
                  smooth: !0,
                  mobile: {
                    breakpoint: 0
                  },
                  tablet: {
                    breakpoint: 0
                  }
                })),
                (this.objs.locomotive.page = new LocomotiveScroll({
                  el: document.querySelector(
                    ".page-main .main-scroll .scroll-container"
                  ),
                  scrollbarContainer: document.querySelector(
                    ".page-main .main-scroll"
                  ),
                  smooth: !0,
                  mobile: {
                    breakpoint: 0
                  },
                  tablet: {
                    breakpoint: 0
                  }
                })),
                this.objs.locomotive.page.on("scroll", ScrollTrigger.update),
                ScrollTrigger.scrollerProxy(
                  document.querySelector(
                    ".page-main .main-scroll .scroll-container"
                  ),
                  {
                    scrollTop: (...e) =>
                      e.length
                        ? this.objs.locomotive.page.scrollTo(e[0], 0, 0)
                        : this.objs.locomotive.page.scroll.instance.scroll.y,
                    getBoundingClientRect: () => ({
                      top: 0,
                      left: 0,
                      width: window.innerWidth,
                      height: window.innerHeight
                    }),
                    pinType: document.querySelector(
                      ".page-main .main-scroll .scroll-container"
                    ).style.transform
                      ? "transform"
                      : "fixed"
                  }
                ),
                ScrollTrigger.addEventListener("refresh", () =>
                  this.objs.locomotive.page.update()
                ),
                ScrollTrigger.refresh(),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-header [data-parallax]"
                  )
                  .forEach((e, t) => {
                    gsap.to(e, {
                      y: () =>
                        window.innerWidth < 1920
                          ? e.getAttribute("data-parallax") *
                            (window.innerWidth / 1920) *
                            50
                          : 1 * e.getAttribute("data-parallax") * 50,
                      scrollTrigger: {
                        scroller: document.querySelector(
                          ".page-main .main-scroll .scroll-container"
                        ),
                        trigger: document.querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-header .header-parallax"
                        ),
                        start: "top 0%",
                        scrub: !0,
                        invalidateOnRefresh: !0
                      }
                    });
                  }),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-footer [data-parallax]"
                  )
                  .forEach((e, t) => {
                    gsap.from(e, {
                      y: () =>
                        window.innerWidth < 1920
                          ? e.getAttribute("data-parallax") *
                            (window.innerWidth / 1920) *
                            50
                          : 1 * e.getAttribute("data-parallax") * 50,
                      scrollTrigger: {
                        scroller: document.querySelector(
                          ".page-main .main-scroll .scroll-container"
                        ),
                        trigger: document.querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-parallax"
                        ),
                        end: "bottom 100%",
                        scrub: !0,
                        invalidateOnRefresh: !0
                      }
                    });
                  }),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-header .header-about .about-photo [data-parallax-ex]"
                  )
                  .forEach((e, t) => {
                    gsap.to(e, {
                      y: () =>
                        e.getAttribute("data-parallax-ex") *
                        (document.querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-header .header-about .about-photo"
                        ).clientHeight /
                          560),
                      scrollTrigger: {
                        scroller: document.querySelector(
                          ".page-main .main-scroll .scroll-container"
                        ),
                        trigger: document.querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-header .header-about .about-photo"
                        ),
                        start: "top bottom",
                        end: "bottom top",
                        scrub: !0,
                        invalidateOnRefresh: !0
                      }
                    });
                  }),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-header .header-roots .roots-photo [data-parallax-ex]"
                  )
                  .forEach((e, t) => {
                    gsap.to(e, {
                      y: () =>
                        e.getAttribute("data-parallax-ex") *
                        (document.querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-header .header-roots .roots-photo"
                        ).clientHeight /
                          560),
                      scrollTrigger: {
                        scroller: document.querySelector(
                          ".page-main .main-scroll .scroll-container"
                        ),
                        trigger: document.querySelector(
                          ".page-main .main-scroll .scroll-container .container-section .section-header .header-roots .roots-photo"
                        ),
                        start: "top bottom",
                        end: "bottom top",
                        scrub: !0,
                        invalidateOnRefresh: !0
                      }
                    });
                  }),
                document
                  .querySelector(".page-roots .roots-background button")
                  .addEventListener(
                    "mouseover",
                    (e) => {
                      (e.preventDefault(),
                        document
                          .querySelector(".page-roots .roots-background div")
                          .classList.add("is-active"));
                    },
                    !1
                  ),
                document
                  .querySelector(".page-roots .roots-background button")
                  .addEventListener(
                    "mouseout",
                    (e) => {
                      (e.preventDefault(),
                        document
                          .querySelector(".page-roots .roots-background div")
                          .classList.remove("is-active"));
                    },
                    !1
                  ),
                document
                  .querySelector(".page-roots .roots-background button")
                  .addEventListener(
                    "mousemove",
                    (e) => {
                      (e.preventDefault(),
                        (this.props.client.dest.x = e.clientX),
                        (this.props.client.dest.y = e.clientY));
                    },
                    !1
                  ),
                document
                  .querySelector(".page-modal .modal-background button")
                  .addEventListener(
                    "mouseover",
                    (e) => {
                      (e.preventDefault(),
                        document
                          .querySelector(".page-modal .modal-background div")
                          .classList.add("is-active"));
                    },
                    !1
                  ),
                document
                  .querySelector(".page-modal .modal-background button")
                  .addEventListener(
                    "mouseout",
                    (e) => {
                      (e.preventDefault(),
                        document
                          .querySelector(".page-modal .modal-background div")
                          .classList.remove("is-active"));
                    },
                    !1
                  ),
                document
                  .querySelector(".page-modal .modal-background button")
                  .addEventListener(
                    "mousemove",
                    (e) => {
                      (e.preventDefault(),
                        (this.props.client.dest.x = e.clientX),
                        (this.props.client.dest.y = e.clientY));
                    },
                    !1
                  ),
                document
                  .querySelectorAll(".page-nav .nav-container a")
                  .forEach((e, t) => {
                    e.addEventListener("click", (t) => {
                      (e.hasAttribute("href") &&
                        e.getAttribute("href").match(/^#header/) &&
                        (t.preventDefault(),
                        this.objs.locomotive.page.scrollTo(
                          document.querySelector(".section-header"),
                          {
                            duration: 0
                          }
                        ),
                        document
                          .querySelector(".page-toggle [data-insert] button")
                          .classList.remove("is-active"),
                        document
                          .querySelector(".page-nav")
                          .classList.remove("is-active")),
                        e.hasAttribute("href") &&
                          e.getAttribute("href").match(/^#history/) &&
                          (t.preventDefault(),
                          this.objs.locomotive.page.scrollTo(
                            document.querySelector(".section-main"),
                            {
                              duration: 0
                            }
                          ),
                          document
                            .querySelector(".page-toggle [data-insert] button")
                            .classList.remove("is-active"),
                          document
                            .querySelector(".page-nav")
                            .classList.remove("is-active")),
                        e.hasAttribute("href") &&
                          e.getAttribute("href").match(/^\.\./) &&
                          (t.preventDefault(),
                          document
                            .querySelector(".page-loading")
                            .classList.remove("is-inactive"),
                          setTimeout(
                            (e) => {
                              window.location.href = e.href;
                            },
                            1e3,
                            t.currentTarget
                          )));
                    });
                  }),
                document.querySelector(".page-main").addEventListener(
                  "mousemove",
                  (e) => {
                    this.objs.liveStage.call({
                      type: "mousemove",
                      cursor: {
                        x: e.clientX,
                        y: e.clientY
                      }
                    });
                  },
                  !1
                ),
                document.querySelector(".page-main").addEventListener(
                  "click",
                  (e) => {
                    this.objs.liveStage.call({
                      type: "click",
                      cursor: {
                        x: e.clientX,
                        y: e.clientY
                      }
                    });
                  },
                  !1
                ),
                document.querySelector(".page-main").addEventListener(
                  "mousemove",
                  (e) => {
                    this.objs.musicStage.call({
                      type: "mousemove",
                      cursor: {
                        x: e.clientX,
                        y: e.clientY
                      }
                    });
                  },
                  !1
                ),
                document.querySelector(".page-main").addEventListener(
                  "click",
                  (e) => {
                    this.objs.musicStage.call({
                      type: "click",
                      cursor: {
                        x: e.clientX,
                        y: e.clientY
                      }
                    });
                  },
                  !1
                ),
                document
                  .querySelector(
                    ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-panel a"
                  )
                  .addEventListener(
                    "mouseover",
                    (e) => {
                      (e.preventDefault(),
                        document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-separate"
                          )
                          .classList.add("is-active"),
                        document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-panel"
                          )
                          .classList.add("is-active"));
                    },
                    !1
                  ),
                document
                  .querySelector(
                    ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-panel a"
                  )
                  .addEventListener(
                    "mouseout",
                    (e) => {
                      (e.preventDefault(),
                        document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-separate"
                          )
                          .classList.remove("is-active"),
                        document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-panel"
                          )
                          .classList.remove("is-active"));
                    },
                    !1
                  ),
                (this.objs.animationFrame.client = () => {
                  (requestAnimationFrame(this.objs.animationFrame.client),
                    (this.props.client.value.x +=
                      (this.props.client.dest.x - this.props.client.value.x) *
                      this.consts.client.rate),
                    (this.props.client.value.y +=
                      (this.props.client.dest.y - this.props.client.value.y) *
                      this.consts.client.rate),
                    (document.querySelector(
                      ".page-roots .roots-background div"
                    ).style.transform =
                      "translate(" +
                      this.props.client.value.x +
                      "px, " +
                      this.props.client.value.y +
                      "px)"),
                    (document.querySelector(
                      ".page-modal .modal-background div"
                    ).style.transform =
                      "translate(" +
                      this.props.client.value.x +
                      "px, " +
                      this.props.client.value.y +
                      "px)"));
                }),
                this.objs.animationFrame.client(),
                document.addEventListener(
                  "mousemove",
                  (e) => {
                    this.props.perspective.dest =
                      (e.clientX / window.innerWidth - 0.5) *
                      this.consts.perspective.amount;
                  },
                  !1
                ),
                (this.objs.animationFrame.perspective = () => {
                  (requestAnimationFrame(this.objs.animationFrame.perspective),
                    (this.props.perspective.value +=
                      (this.props.perspective.dest -
                        this.props.perspective.value) *
                      this.consts.perspective.rate),
                    document
                      .querySelectorAll("[data-preserve]")
                      .forEach((e, t) => {
                        e.style.transform = `perspective(1920px) rotateY(${this.props.perspective.value}deg)`;
                      }),
                    document
                      .querySelectorAll("[data-preserve-r]")
                      .forEach((e, t) => {
                        e.style.transform = `perspective(480px) rotateY(${-this.props.perspective.value}deg)`;
                      }));
                }),
                this.objs.animationFrame.perspective(),
                (this.objs.animationFrame.rumble = () => {
                  (requestAnimationFrame(this.objs.animationFrame.rumble),
                    (document.querySelector(".page-rumble").style.top =
                      50 * Math.random() - 100 + "px"),
                    (document.querySelector(".page-rumble").style.left =
                      50 * Math.random() - 100 + "px"));
                }),
                this.objs.animationFrame.rumble()),
              "sd" == consts.device &&
                ((this.objs.intersectionObserver.main =
                  new IntersectionObserver(
                    (e, t) => {
                      e.forEach((e) => {
                        e.isIntersecting
                          ? (document
                              .querySelector(".page-audio")
                              .classList.add("is-active"),
                            document
                              .querySelector(
                                ".page-main .main-scroll .scroll-container .container-section .section-background .background-distortion"
                              )
                              .classList.add("is-active"))
                          : (document
                              .querySelector(".page-audio")
                              .classList.remove("is-active"),
                            document
                              .querySelector(
                                ".page-main .main-scroll .scroll-container .container-section .section-background .background-distortion"
                              )
                              .classList.remove("is-active"));
                      });
                    },
                    {
                      root: null,
                      rootMargin: "-50% 0%"
                    }
                  )),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-main"
                  )
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.main.observe(e);
                  }),
                (this.objs.intersectionObserver.live = new IntersectionObserver(
                  (e, t) => {
                    e.forEach((e) => {
                      e.isIntersecting &&
                        (document
                          .querySelector(
                            ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                          )
                          .classList.add("is-active"),
                        this.objs.liveStage.call({
                          type: "show"
                        }),
                        this.objs.intersectionObserver.live.unobserve(
                          e.target
                        ));
                    });
                  },
                  {
                    root: null,
                    rootMargin: "-20% 0%"
                  }
                )),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                  )
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.live.observe(e);
                  }),
                (this.objs.intersectionObserver.music =
                  new IntersectionObserver(
                    (e, t) => {
                      e.forEach((e) => {
                        e.isIntersecting &&
                          (this.objs.musicStage.call({
                            type: "show"
                          }),
                          this.objs.intersectionObserver.music.unobserve(
                            e.target
                          ));
                      });
                    },
                    {
                      root: null,
                      rootMargin: "-20% 0%"
                    }
                  )),
                document
                  .querySelectorAll(
                    ".page-main .main-scroll .scroll-container .container-section .section-main .main-music"
                  )
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.music.observe(e);
                  }),
                (this.objs.intersectionObserver.footer =
                  new IntersectionObserver(
                    (e, t) => {
                      e.forEach((e) => {
                        e.isIntersecting &&
                          (e.target.classList.add("is-trigger"),
                          this.objs.intersectionObserver.footer.unobserve(
                            e.target
                          ));
                      });
                    },
                    {
                      root: null,
                      rootMargin: "-20% 0%"
                    }
                  )),
                document
                  .querySelectorAll(".section-footer [data-trigger]")
                  .forEach((e, t) => {
                    this.objs.intersectionObserver.footer.observe(e);
                  }),
                document
                  .querySelectorAll(".page-nav .nav-container a")
                  .forEach((e, t) => {
                    e.addEventListener("click", (t) => {
                      (e.hasAttribute("href") &&
                        e.getAttribute("href").match(/^#header/) &&
                        (t.preventDefault(),
                        (document.scrollingElement.scrollTop =
                          document.querySelector(".section-header").offsetTop),
                        document
                          .querySelector(".page-toggle [data-insert] button")
                          .classList.remove("is-active"),
                        document
                          .querySelector(".page-nav")
                          .classList.remove("is-active")),
                        e.hasAttribute("href") &&
                          e.getAttribute("href").match(/^#history/) &&
                          (t.preventDefault(),
                          (document.scrollingElement.scrollTop =
                            document.querySelector(".section-main").offsetTop),
                          document
                            .querySelector(".page-toggle [data-insert] button")
                            .classList.remove("is-active"),
                          document
                            .querySelector(".page-nav")
                            .classList.remove("is-active")),
                        e.hasAttribute("href") &&
                          e.getAttribute("href").match(/^\.\./) &&
                          (t.preventDefault(),
                          document
                            .querySelector(".page-loading")
                            .classList.remove("is-inactive"),
                          setTimeout(
                            (e) => {
                              window.location.href = e.href;
                            },
                            1e3,
                            t.currentTarget
                          )));
                    });
                  }),
                document
                  .querySelector(
                    ".page-main .main-scroll .scroll-container .container-section .section-main .main-live .live-button button"
                  )
                  .addEventListener("click", (e) => {
                    (document
                      .querySelector(".page-loading")
                      .classList.remove("is-inactive"),
                      setTimeout(() => {
                        window.location.href = "../roll-and-bounce/";
                      }, 1e3));
                  }),
                document.querySelector(".page-main").addEventListener(
                  "click",
                  (e) => {
                    this.objs.liveStage.call({
                      type: "click",
                      cursor: {
                        x: e.clientX,
                        y: e.clientY
                      }
                    });
                  },
                  !1
                ),
                document.querySelector(".page-main").addEventListener(
                  "click",
                  (e) => {
                    this.objs.musicStage.call({
                      type: "click",
                      cursor: {
                        x: e.clientX,
                        y: e.clientY
                      }
                    });
                  },
                  !1
                )),
              document
                .querySelector(".page-toggle [data-insert] button")
                .addEventListener("click", (e) => {
                  (e.preventDefault(),
                    document
                      .querySelector(".page-toggle [data-insert] button")
                      .classList.contains("is-active")
                      ? (document
                          .querySelector(".page-toggle [data-insert] button")
                          .classList.remove("is-active"),
                        document
                          .querySelector(".page-nav")
                          .classList.remove("is-active"),
                        this.objs.sound.allpass())
                      : (document
                          .querySelector(".page-toggle [data-insert] button")
                          .classList.add("is-active"),
                        document
                          .querySelector(".page-nav")
                          .classList.add("is-active"),
                        this.objs.sound.lowpass()));
                }),
              document
                .querySelector(".page-audio button")
                .addEventListener("click", (e) => {
                  (e.preventDefault(),
                    document
                      .querySelector(".page-audio button span")
                      .classList.contains("is-inactive")
                      ? (document
                          .querySelector(".page-audio button span")
                          .classList.remove("is-inactive"),
                        this.objs.sound.muted({
                          value: !1
                        }))
                      : (document
                          .querySelector(".page-audio button span")
                          .classList.add("is-inactive"),
                        this.objs.sound.muted({
                          value: !0
                        })));
                }),
              document
                .querySelector(
                  ".page-main .main-scroll .scroll-container .container-section .section-header .header-roots .roots-playlist div[data-insert] div[data-parallax] button"
                )
                .addEventListener("click", (e) => {
                  (document
                    .querySelector(".page-toggle")
                    .classList.add("is-inactive"),
                    document
                      .querySelector(".page-roots")
                      .classList.add("is-active"));
                }),
              document
                .querySelector(".page-roots .roots-close button")
                .addEventListener("click", (e) => {
                  (e.preventDefault(),
                    document
                      .querySelector(".page-toggle")
                      .classList.remove("is-inactive"),
                    document
                      .querySelector(".page-roots")
                      .classList.remove("is-active"));
                }),
              document
                .querySelector(".page-roots .roots-background button")
                .addEventListener(
                  "click",
                  (e) => {
                    (e.preventDefault(),
                      document
                        .querySelector(".page-toggle")
                        .classList.remove("is-inactive"),
                      document
                        .querySelector(".page-roots")
                        .classList.remove("is-active"),
                      document
                        .querySelector(".page-roots .roots-background div")
                        .classList.remove("is-active"));
                  },
                  !1
                ),
              document
                .querySelector(".page-view button")
                .addEventListener("click", (e) => {
                  (e.preventDefault(),
                    this.objs.musicStage.call({
                      type: "open"
                    }));
                }),
              document
                .querySelector(".page-modal .modal-close button")
                .addEventListener("click", (e) => {
                  (e.preventDefault(),
                    this.objs.liveStage.call({
                      type: "close"
                    }),
                    this.objs.musicStage.call({
                      type: "close"
                    }));
                }),
              document
                .querySelector(".page-modal .modal-background button")
                .addEventListener(
                  "click",
                  (e) => {
                    (e.preventDefault(),
                      this.objs.liveStage.call({
                        type: "close"
                      }),
                      this.objs.musicStage.call({
                        type: "close"
                      }));
                  },
                  !1
                ),
              window.addEventListener(
                "resize",
                () => {
                  document
                    .querySelector(".page-view")
                    .classList.contains("is-active") &&
                    (this.objs.liveStage.call({
                      type: "close"
                    }),
                    this.objs.musicStage.call({
                      type: "close"
                    }));
                },
                !1
              ),
              document.addEventListener(
                "touchmove",
                () => {
                  document
                    .querySelector(".page-view")
                    .classList.contains("is-active") &&
                    (this.objs.liveStage.call({
                      type: "close"
                    }),
                    this.objs.musicStage.call({
                      type: "close"
                    }));
                },
                !1
              ),
              document.addEventListener(
                "wheel",
                () => {
                  document
                    .querySelector(".page-view")
                    .classList.contains("is-active") &&
                    (this.objs.liveStage.call({
                      type: "close"
                    }),
                    this.objs.musicStage.call({
                      type: "close"
                    }));
                },
                !1
              ),
              document.addEventListener(
                "visibilitychange",
                (e) => {
                  ("hidden" == document.visibilityState &&
                    this.objs.sound.muted({
                      value: !0
                    }),
                    "visible" == document.visibilityState &&
                      this.objs.sound.muted({
                        value: !1
                      }));
                },
                !1
              ),
              document
                .querySelector(
                  ".page-main .main-scroll .scroll-container .container-section .section-footer .footer-panel a"
                )
                .addEventListener("click", (e) => {
                  (e.preventDefault(),
                    document
                      .querySelector(".page-loading")
                      .classList.remove("is-inactive"),
                    setTimeout(
                      (e) => {
                        window.location.href = e.href;
                      },
                      1e3,
                      e.currentTarget
                    ));
                }),
              (this.objs.animationFrame.live = () => {
                (requestAnimationFrame(this.objs.animationFrame.live),
                  (this.props.position =
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                      )
                      .getBoundingClientRect().top -
                    window.innerHeight / 2),
                  (this.props.height = document.querySelector(
                    ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                  ).clientHeight),
                  (this.props.ratio =
                    document.querySelector(
                      ".page-main .main-scroll .scroll-container .container-section .section-main .main-live"
                    ).clientHeight /
                    (((window.innerWidth < 1920 ? window.innerWidth : 1920) /
                      1920) *
                      1440)),
                  this.objs.liveStage.call({
                    type: "position",
                    value:
                      (-this.props.position / this.props.height) *
                      this.props.ratio
                  }));
              }),
              this.objs.animationFrame.live(),
              (this.objs.animationFrame.music = () => {
                (requestAnimationFrame(this.objs.animationFrame.music),
                  (this.props.position =
                    document
                      .querySelector(
                        ".page-main .main-scroll .scroll-container .container-section .section-main .main-music"
                      )
                      .getBoundingClientRect().top -
                    window.innerHeight / 2),
                  (this.props.height = document.querySelector(
                    ".page-main .main-scroll .scroll-container .container-section .section-main .main-music"
                  ).clientHeight),
                  (this.props.ratio =
                    document.querySelector(
                      ".page-main .main-scroll .scroll-container .container-section .section-main .main-music"
                    ).clientHeight /
                    (((window.innerWidth < 1920 ? window.innerWidth : 1920) /
                      1920) *
                      1440)),
                  this.objs.musicStage.call({
                    type: "position",
                    value:
                      (-this.props.position / this.props.height) *
                      this.props.ratio
                  }));
              }),
              this.objs.animationFrame.music(),
              this.args.callback({
                type: "builded"
              })),
            "run" == e.type &&
              (this.objs.liveStage.call({
                type: "add"
              }),
              this.objs.musicStage.call({
                type: "add"
              }),
              setTimeout(() => {
                (document
                  .querySelector(".page-loading .loading-container")
                  .classList.add("is-exit"),
                  setTimeout(() => {
                    (document
                      .querySelector(".page-loading")
                      .classList.add("is-inactive"),
                      setTimeout(() => {
                        ("#history" == location.hash &&
                          ("pc" == consts.device &&
                            this.objs.locomotive.page.scrollTo(
                              document.querySelector(".section-main"),
                              {
                                duration: 0
                              }
                            ),
                          "sd" == consts.device &&
                            (document.scrollingElement.scrollTop =
                              document.querySelector(
                                ".section-main"
                              ).offsetTop)),
                          document
                            .querySelector(".page")
                            .classList.add("is-active"));
                      }, 500));
                  }, 500));
              }, 500)));
        }));
    }
  };
let consts = {
  device:
    navigator.userAgent.indexOf("iPhone") > 0 ||
    navigator.userAgent.indexOf("iPad") > 0 ||
    navigator.userAgent.indexOf("iPod") > 0 ||
    navigator.userAgent.indexOf("Android") > 0
      ? "sd"
      : "pc",
  mousewheelevent:
    "onwheel" in document
      ? "wheel"
      : "onmousewheel" in document
        ? "mousewheel"
        : "DOMMouseScroll",
  responsive: window.innerWidth < 960 ? "sd" : "pc"
};
("pc" == consts.device &&
  document.querySelector("body").classList.add("is-hover"),
  window.matchMedia("(max-width: 960px)").addEventListener("change", () => {
    window.location.reload();
  }),
  window.addEventListener("pageshow", function (e) {
    e.persisted && window.location.reload();
  }),
  window.addEventListener("load", (e) => {
    let t = new Page({
      callback: (e) => {
        ("loaded" == e.type &&
          t.call({
            type: "render"
          }),
          "rendered" == e.type &&
            t.call({
              type: "build"
            }),
          "builded" == e.type &&
            t.call({
              type: "run"
            }));
      }
    });
    t.call({
      type: "load"
    });
  }));
let loading_src = ["./asset/img/loading.svg"],
  loading_image = [new Image()],
  loading_count = 0;
for (let e = 0; e < loading_image.length; ++e)
  ((loading_image[e].onload = (e) => {
    (loading_count++,
      loading_count == loading_image.length &&
        document
          .querySelector(".page-loading .loading-container")
          .classList.add("is-enter"));
  }),
    (loading_image[e].src = loading_src[e]));
